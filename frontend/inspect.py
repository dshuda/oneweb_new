
import cv2
import numpy as np

img = cv2.imread('C:/Users/USER/Downloads/home.png')
h, w, _ = img.shape
print(f'Dimensions: {w}x{h}')

# 1. Footer (bottom 10%)
cv2.imwrite('footer.png', img[int(h*0.9):h, 0:w])

# 2. Search bar / top search (around y: 120-160px relative to image height or proportional)
# Let's crop search area: y from 0.1 to 0.18, x from 0.2 to 0.8
cv2.imwrite('search.png', img[int(h*0.11):int(h*0.16), int(w*0.3):int(w*0.7)])

# 3. Services section (around y: 0.2 to 0.3)
cv2.imwrite('services.png', img[int(h*0.20):int(h*0.27), int(w*0.1):int(w*0.9)])

# 4. View all (near trending services header around y: 0.25)
cv2.imwrite('view_all.png', img[int(h*0.24):int(h*0.27), int(w*0.5):int(w*0.9)])

# 5. Feature icons (around y: 0.5 to 0.55)
cv2.imwrite('features.png', img[int(h*0.5):int(h*0.56), int(w*0.3):int(w*0.7)])

# 6. App promo graphic (around y: 0.57 to 0.65)
cv2.imwrite('app_promo.png', img[int(h*0.57):int(h*0.66), int(w*0.3):int(w*0.7)])

print('Crops saved successfully')
