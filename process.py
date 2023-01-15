import subprocess
import os

import tkinter 
from tkinter import ttk
from PIL import ImageTk, Image
# from tkinter import Image, ImageTk

from removegreen import convert as processImage

# print(processImage("./nate-doublepunch"))

def vsum(a, b):
	return tuple(a[i] + b[i] for i in range(len(a)))
def processSprites(folder):
	vals = []
	files = os.listdir(folder)
	filesOut = []
	for i, filename in enumerate(files):
		if "out" in filename: continue
		os.system(f"title {i} of {len(files)}")
		path = os.path.join(folder, filename)
		coords = processImage(path)
		# x = -(coords['left'] + coords['right'])/2
		# y = -(coords['bottom'] + coords['top'])/2
		x,y = 0,0
		vals.append((x, y))
		filesOut.append(coords['file']);
	delta = [vsum(vals[i], list(-x for x in vals[i-1 if i > 1 else i])) for i in range(len(vals))]

	# def savePosn(event):
	#     global lastx, lasty
	#     lastx, lasty = event.x, event.y

	# def addLine(event):
	#     canvas.create_line((lastx, lasty, event.x, event.y))
	#     savePosn(event)

	global framecount
	global pos
	global fstart
	global fend

	pos = (0, 0)
	framecount = 0
	fstart = 0
	fend = 100
	def mousedown(event):
		global pos
		global framecount
		framecount = event.x
		# print(event.x)
		pos = (0, 0)
	def restart():
		global framecount
		framecount = 0

	print(filesOut[0])
	im = Image.open(filesOut[0])
	print(im.mode)

	global yumyum
	yumyum = []

	def nextframe():
		global pos
		global framecount
		global yumyum
		global fstart
		global fend
		i = fstart+ ( (framecount) % (min(fend, len(delta))-fstart) )
		pos = vsum(pos, delta[i])
		dx, dy = 0,0 #vals[i]

		canvas.delete("all")
		myimg = ImageTk.PhotoImage(file=filesOut[i])
		yumyum = myimg
		# img=ImageTk.PhotoImage(Image.open("camels.jpg"))
		# canvas.create_image(250, 250, anchor=CENTER, image=img)

		# photoimage = ImageTk.PhotoImage(file="example.png")
		# canvas.create_image(150, 150, image=photoimage)

		# canvas.create_image(-pos[0]+dx, -pos[1]+dy, image=myimg, anchor='nw')
		canvas.create_image(100, 100, image=myimg) # anchor='nw')
		canvas.create_text(20, 20, text=f'{fstart}->{fend} {framecount} {i}', anchor='nw', font='TkMenuFont', fill='red')

		framecount += 1
		root.after(30, nextframe)

	root = tkinter.Tk()
	# root.columnconfigure(0, weight=1)
	# root.rowconfigure(0, weight=1)
	# root.geometry("400x400")

	canvas = tkinter.Canvas(root, width=400, height=400, background='white')
	# canvas.grid(column=0, row=0, sticky=(N, W, E, S))
	canvas.bind("<Button-1>", mousedown)
	# canvas.bind("<Button-1>", savePosn)
	# canvas.bind("<B1-Motion>", addLine)
	canvas.pack()

	def setstart():
		global fstart
		fstart = int(inputtxt.get(1.0, "end-1c"))
	def setend():
		global fend
		fend = int(inputtxt.get(1.0, "end-1c"))
  
	# TextBox Creation
	inputtxt = tkinter.Text(root, height=1, width=20)
	inputtxt.pack()
	# Button Creation
	printButton = tkinter.Button(root, text="start", command=setstart)
	printButton.pack()
	printButton = tkinter.Button(root, text="end", command=setend)
	printButton.pack()
	printButton = tkinter.Button(root, text="reset", command=restart)
	printButton.pack()

	root.after(30, nextframe)
	root.mainloop()

	return ("// END //",)

print(processSprites("nate-fullanphufightsource"))