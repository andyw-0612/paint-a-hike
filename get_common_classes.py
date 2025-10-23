import torch
import os
import numpy as np
from PIL import Image
from transformers import SegformerImageProcessor, SegformerForSemanticSegmentation
from collections import Counter
from tqdm import tqdm

# --- Configuration ---
IMAGE_FOLDER = 'data/images' 
MODEL_NAME = "nvidia/segformer-b3-finetuned-ade-512-512" 

# --- Load Model and Processor ---
print(f"Loading model {MODEL_NAME}...")
if torch.cuda.is_available():
    device = "cuda"
elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
    device = "mps"
else:
    device = "cpu"

try:
    processor = SegformerImageProcessor.from_pretrained(MODEL_NAME)
    model = SegformerForSemanticSegmentation.from_pretrained(MODEL_NAME).to(device)
    model.eval()
    id2label = model.config.id2label
    print("Model loaded successfully. Starting analysis.")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Check network connection and library installation.")
    exit()

# --- Initialize Counter ---
# Stores {class_id: count} of how many images that class was detected in
class_detection_counts = Counter() 
total_images_processed = 0

# --- Get All Image Files ---
try:
    all_filenames = [f for f in os.listdir(IMAGE_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
except FileNotFoundError:
    print(f"Error: Image folder not found at {IMAGE_FOLDER}")
    exit()

if not all_filenames:
    print("No images found in the folder.")
    exit()

# --- Process Every Image in the Dataset ---
print(f"Analyzing {len(all_filenames)} images...")
for filename in tqdm(all_filenames):
    image_path = os.path.join(IMAGE_FOLDER, filename)

    try:
        image_pil = Image.open(image_path).convert("RGB")
        
        # --- Preprocess and Predict ---
        inputs = processor(images=image_pil, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
        
        # Upsample logits and get predicted class ID for each pixel
        upsampled_logits = torch.nn.functional.interpolate(
            logits,
            size=image_pil.size[::-1], 
            mode='bilinear',
            align_corners=False
        )
        pred_seg = upsampled_logits.argmax(dim=1)[0].cpu().numpy()

        # --- Tally Detected Classes ---
        unique_ids = np.unique(pred_seg)
        
        # Count how many images each class was detected in
        for class_id in unique_ids:
            if class_id in id2label:
                # Increment the counter for this class ID
                class_detection_counts[class_id] += 1
        
        total_images_processed += 1

    except Exception as e:
        print(f"\nError processing {filename}: {e}. Skipping.")

# --- Output Results ---
print("\n" + "="*50)
print(f"CLASS DETECTION FREQUENCY (Total Images: {total_images_processed})")
print("="*50)

# Sort results by count in descending order
ranked_classes = sorted(class_detection_counts.items(), key=lambda item: item[1], reverse=True)

if ranked_classes:
    print("Rank | Class Name (ADE20K ID) | Detection Count | Frequency")
    print("-" * 65)
    
    for rank, (class_id, count) in enumerate(ranked_classes):
        class_name = id2label.get(class_id, f"ID {class_id} (Unknown)")
        frequency = (count / total_images_processed) * 100
        
        print(f"{rank + 1:<4} | {class_name:<25} (ID {class_id:<3}) | {count:<15} | {frequency:.2f}%")
        
        # Suggest useful UI brushes based on high frequency
        if rank < 10 and frequency > 50: # Example threshold for common classes
            if class_name in ['sky', 'mountain', 'water', 'tree', 'road']:
                 print(f"     ^ Recommended UI Brush: {class_name.upper()}")

    print("\nNext Step: Select the top 5-7 high-frequency, relevant classes (e.g., sky, tree, mountain, water) for your 'Smart Canvas' brushes.")
else:
    print("Analysis finished, but no relevant classes were tallied.")