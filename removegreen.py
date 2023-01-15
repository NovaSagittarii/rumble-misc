# https://github.com/kimmobrunfeldt/howto-everything/blob/master/remove-green.md

"""
Removes greenscreen from an image.
Usage: python greenscreen_remove.py image.jpg
"""

from PIL import Image
import sys
import os

def rgb_to_hsv(r, g, b):
    maxc = max(r, g, b)
    minc = min(r, g, b)
    v = maxc
    if minc == maxc:
        return 0.0, 0.0, v
    s = (maxc-minc) / maxc
    rc = (maxc-r) / (maxc-minc)
    gc = (maxc-g) / (maxc-minc)
    bc = (maxc-b) / (maxc-minc)
    if r == maxc:
        h = bc-gc
    elif g == maxc:
        h = 2.0+rc-bc
    else:
        h = 4.0+gc-rc
    h = (h/6.0) % 1.0
    return h, s, v

GREEN_RANGE_MIN_HSV = (100, 60, 70) # (100, 80, 70)
GREEN_RANGE_MAX_HSV = (185, 255, 255)

def convert(file_path):
    name, ext = os.path.splitext(file_path)
    im = Image.open(file_path)
    im = im.convert('RGBA')

    # Go through all pixels and turn each 'green' pixel to transparent

    output = {
        'left': None,
        'right': None,
        'top': None,
        'bottom': None
    }
    newfile = name + '-out.png'
    output['file'] = newfile
    skip = False

    if not skip:
        pix = im.load()
        width, height = im.size
        for x in range(width):
            for y in range(height):
                r, g, b, a = pix[x, y]
                h_ratio, s_ratio, v_ratio = rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
                h, s, v = (h_ratio * 360, s_ratio * 255, v_ratio * 255)

                min_h, min_s, min_v = GREEN_RANGE_MIN_HSV
                max_h, max_s, max_v = GREEN_RANGE_MAX_HSV
                if min_h <= h <= max_h and min_s <= s <= max_s and min_v <= v <= max_v:
                    pix[x, y] = (0, 0, 0, 0)
                else:
                    output['left'] = x if output['left'] == None else min(output['left'], x)
                    output['right'] = x if output['right'] == None else max(output['right'], x)
                    output['top'] = y if output['top'] == None else min(output['top'], y)
                    output['bottom'] = y if output['bottom'] == None else max(output['bottom'], y)
        output['x'] = output['left']
        output['y'] = output['bottom']
        im.save(newfile)
    return output
def main():
    # Load image and convert it to RGBA, so it contains alpha channel
    # print(sys.argv)
    file_path = sys.argv[1]
    convert(file_path)


if __name__ == '__main__':
    main()