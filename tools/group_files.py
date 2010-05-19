import sys

file = open("../packed_file_list")
text = file.read()
file.close()
files = text.split("\n")
output = open("sparks_collection.js", "w")
for v in files:
	if not v:
		continue
	if v[0] == "#":
		continue
	file_name = "../js/" + v
	try:
		file = open(file_name)
		output.write(file.read())
	except IOError:
		print "File not found: " + file_name
	file.close()
output.close()	
