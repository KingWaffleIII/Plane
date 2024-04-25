# Creates a markdown file with aircraft information from mrast.json and rast.json

import json

with open("src/rast.json") as f:
	rast = json.load(f)
with open("src/mrast.json") as f:
	mrast = json.load(f)

with open("aircraft.md", "w+") as f:
	total_aircraft = len(rast + mrast)
	f.write(f"**Total aircraft: {total_aircraft}**\n\n")
	f.write(f"**[RAST](#RAST): {len(rast)}**\n\n")
	f.write(f"**[mRAST](#mRAST): {len(mrast)}**\n\n")
	f.write(f"**Click on a spec to fast travel.**\n**Click on an aircraft to view images.**\n\n")

	f.write("## RAST:\n")
	for i in rast:
		f.write(
			f"""
### [{i["name"]}]({i["image"]})
**Full name: {i["full"]}**
"""
		)

	f.write("## mRAST:\n")
	for i in mrast:
		f.write(
			f"""
### [{i["name"]}]({i["image"]})
**Full name: {i["full"]}**
"""
		)
