import torch
import os
import numpy as np
from PIL import Image
from transformers import SegformerImageProcessor, SegformerForSemanticSegmentation, CLIPProcessor, CLIPModel
import matplotlib.colors as mcolors
from tqdm import tqdm

# --- Configuration ---
# NOTE: Update 'data/images' to your actual folder path if different
IMAGE_FOLDER = 'data/original' 
OUTPUT_DIR = 'data/processed' # Folder to save all output files: _masks.npy, _vector.npy, _ui_map.png
MODEL_NAME_SEG = "nvidia/segformer-b5-finetuned-ade-640-640" 
MODEL_NAME_CLIP = "openai/clip-vit-large-patch14-336" 

# --- UI Brush Mapping and Colors (The core of your compositional search) ---
DISTINCT_COLORS = [
    '#b3e5fc', '#617361', '#4aa3d2', '#2e8b57', 
    '#e79ab8', '#a49f9a', '#bfa893', 
    '#7ab460', '#897360', '#ff0000'
]
UI_BRUSH_MAPPING = {
    # Main Landscape Elements
    "SKY":           {'color': DISTINCT_COLORS[0], 'ade_names': ['sky']},
    "MOUNTAIN":      {'color': DISTINCT_COLORS[1], 'ade_names': ['mountain', 'hill']},
    "WATER_BODY":    {'color': DISTINCT_COLORS[2], 'ade_names': ['water', 'sea', 'lake', 'river']},
    "FOREST_TREES":  {'color': DISTINCT_COLORS[3], 'ade_names': ['tree', 'trees', 'plant', 'bush']},
    # Specific Elements
    "FLOWERS":       {'color': DISTINCT_COLORS[4], 'ade_names': ['flower', 'flowers']},
    "BOULDERS_CLIFF":{'color': DISTINCT_COLORS[5], 'ade_names': ['rock', 'stone', 'boulder', 'cliff']},
    # Ground/Trail Elements
    "PATH_ROAD":     {'color': DISTINCT_COLORS[6], 'ade_names': ['road', 'path', 'trail', 'sidewalk']},
    "GRASS_FIELD":   {'color': DISTINCT_COLORS[7], 'ade_names': ['grass', 'lawn', 'field', 'meadow']},
    "EARTH_LAND":    {'color': DISTINCT_COLORS[8], 'ade_names': ['earth', 'land', 'soil', 'ground']}, 
    # Catch-all (Kept for completeness but excluded from binary mask stacking)
    "INVALID_OTHER": {'color': DISTINCT_COLORS[9], 'ade_names': []} 
}

# List of UI classes used for the binary mask channels (excludes the catch-all)
TARGET_UI_CLASSES = [name for name in UI_BRUSH_MAPPING if name != "INVALID_OTHER"]


# --- Initial Setup and Model Loading ---
os.makedirs(OUTPUT_DIR, exist_ok=True)
device = "cuda" if torch.cuda.is_available() else "cpu"

try:
    # 1. SegFormer Setup
    seg_processor = SegformerImageProcessor.from_pretrained(MODEL_NAME_SEG)
    seg_model = SegformerForSemanticSegmentation.from_pretrained(MODEL_NAME_SEG).to(device)
    seg_model.eval()
    id2label = seg_model.config.id2label

    # 2. CLIP Setup
    clip_processor = CLIPProcessor.from_pretrained(MODEL_NAME_CLIP)
    clip_model = CLIPModel.from_pretrained(MODEL_NAME_CLIP).to(device)
    clip_model.eval()
    
    # --- Build Mapping Tables ---
    ID_TO_CUSTOM_COLOR = {}  # SegFormer ID -> RGB Color
    ID_TO_UI_CLASS = {}      # SegFormer ID -> UI Class Name
    COLOR_LEGEND = {} 
    mapped_ids = set()

    # Build the mappings for all target classes
    for ui_class, data in UI_BRUSH_MAPPING.items():
        rgb_float = mcolors.hex2color(data['color'])
        rgb_uint8 = (np.array(rgb_float) * 255).astype(np.uint8)
        COLOR_LEGEND[ui_class] = rgb_uint8 

        for model_id, model_name in id2label.items():
            if any(name in model_name for name in data['ade_names']):
                ID_TO_CUSTOM_COLOR[model_id] = rgb_uint8
                ID_TO_UI_CLASS[model_id] = ui_class
                mapped_ids.add(model_id)

    # Handle the catch-all
    invalid_color = COLOR_LEGEND["INVALID_OTHER"]
    unmapped_ids = set(id2label.keys()) - mapped_ids
    for model_id in unmapped_ids:
        ID_TO_CUSTOM_COLOR[model_id] = invalid_color
        ID_TO_UI_CLASS[model_id] = "INVALID_OTHER"
    
    print(f"✅ Models loaded on {device}. UI Classes mapped: {len(TARGET_UI_CLASSES)}")

except Exception as e:
    print(f"Error loading models or building mappings: {e}")
    exit()

# --- Processing Loop ---
all_filenames = [f for f in os.listdir(IMAGE_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
if not all_filenames:
    print("No images found in the folder.")
    exit()

print(f"\nProcessing {len(all_filenames)} images...")
for filename in tqdm(all_filenames):
    image_path = os.path.join(IMAGE_FOLDER, filename)
    file_base, _ = os.path.splitext(filename)

    try:
        image_pil = Image.open(image_path).convert("RGB")
        
        # Run SegFormer inference
        seg_inputs = seg_processor(images=image_pil, return_tensors="pt").to(device)
        with torch.no_grad():
            seg_outputs = seg_model(**seg_inputs)
            logits = seg_outputs.logits
        
        # Upsample to original size and get prediction map (raw IDs)
        upsampled_logits = torch.nn.functional.interpolate(
            logits, size=image_pil.size[::-1], mode='bilinear', align_corners=False
        )
        pred_seg_id_map = upsampled_logits.argmax(dim=1)[0].cpu().numpy()


        # --- 1. GENERATE STACKED BINARY MASKS (For IOU) ---
        binary_mask_channels = []

        for ui_class in TARGET_UI_CLASSES:
            class_mask = np.zeros_like(pred_seg_id_map, dtype=np.uint8)
            
            # Find all SegFormer IDs that map to the current UI class
            relevant_seg_ids = [id_val for id_val, name in ID_TO_UI_CLASS.items() if name == ui_class]
            
            # Set pixels to 1 where the SegFormer ID map matches any relevant ID
            for seg_id in relevant_seg_ids:
                class_mask[pred_seg_id_map == seg_id] = 1
                
            binary_mask_channels.append(class_mask)

        # Stack into a single (N_classes, H, W) array and save
        stacked_masks = np.stack(binary_mask_channels, axis=0)
        np.save(os.path.join(OUTPUT_DIR, f"{file_base}_masks.npy"), stacked_masks)


        # --- 2. GENERATE GLOBAL CLIP EMBEDDING (For Aesthetic Search) ---
        clip_inputs = clip_processor(images=image_pil, return_tensors="pt").to(device)
        with torch.no_grad():
            image_features = clip_model.get_image_features(pixel_values=clip_inputs.pixel_values)
        
        # Save the global CLIP vector
        clip_vector = image_features.squeeze().cpu().numpy()
        np.save(os.path.join(OUTPUT_DIR, f"{file_base}_vector.npy"), clip_vector)
        
        
        # --- 3. GENERATE COLOR-MAPPED IMAGE (For Visual Demo/Debugging) ---
        color_array = np.zeros((*pred_seg_id_map.shape, 3), dtype=np.uint8)
        unique_ids = np.unique(pred_seg_id_map)
        
        for class_id in unique_ids:
            color = ID_TO_CUSTOM_COLOR.get(class_id, COLOR_LEGEND["INVALID_OTHER"])
            color_array[pred_seg_id_map == class_id] = color
        
        colored_mask = Image.fromarray(color_array)
        colored_mask.save(os.path.join(OUTPUT_DIR, f"{file_base}_ui_map.png"))

    except Exception as e:
        print(f"\nError processing {filename}. Skipping. Error: {e}")
        continue

print(f"\n🎉 Data pipeline complete! All assets saved to {OUTPUT_DIR}")
print(f"Generated {len(all_filenames)} image assets, including:")
print(" - **_masks.npy** (Stacked binary masks for IOU - compositional search)")
print(" - **_vector.npy** (CLIP embeddings for FAISS - aesthetic search)")
print(" - **_ui_map.png** (Visual confirmation)")