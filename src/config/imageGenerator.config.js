// AI Image Generator Configuration

// Note: In a real application, these thumbnail URLs would point to actual
// image assets, e.g., '/assets/images/presets/realistic.png'
export const stylePresets = [
  { 
    id: 'realistic', 
    name: '写实', 
    thumbnail: 'https://via.placeholder.com/80/FFDDC1/000000?text=R' 
  },
  { 
    id: 'anime', 
    name: '动漫', 
    thumbnail: 'https://via.placeholder.com/80/FFABAB/000000?text=A' 
  },
  { 
    id: 'oil-painting', 
    name: '油画', 
    thumbnail: 'https://via.placeholder.com/80/FFC3A0/000000?text=O' 
  },
  { 
    id: 'watercolor', 
    name: '水彩', 
    thumbnail: 'https://via.placeholder.com/80/D4F1F4/000000?text=W' 
  },
  { 
    id: 'sketch', 
    name: '素描', 
    thumbnail: 'https://via.placeholder.com/80/DDDDDD/000000?text=S' 
  },
  { 
    id: 'cyberpunk', 
    name: '赛博朋克', 
    thumbnail: 'https://via.placeholder.com/80/C780E8/000000?text=C' 
  },
];

export const defaultImageSize = '1024x1024';

export const imageSizeOptions = [
  { label: "正方形 1024x1024", value: "1024x1024" },
  { label: "竖版 768x1152", value: "768x1152" },
  { label: "横版 1152x768", value: "1152x768" },
];
