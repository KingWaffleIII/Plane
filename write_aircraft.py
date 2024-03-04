# Creates a markdown file with aircraft information from mrast.json and rast.json

import json


def write_aircraft(f, data):
    aliases = (
        [f"- {alias}\n" for alias in data["aliases"]]
        if len(data["aliases"]) > 0
        else ["None\n"]
    )
    f.write(
        f"""
### {data["name"]}
**Aliases:**
{"".join(aliases)}
"""
    )


with open("src/rast.json") as f:
    rast = json.load(f)
with open("src/mrast.json") as f:
    mrast = json.load(f)

with open("aircraft.md", "w+") as f:
    total_aircraft = len(rast + mrast)
    f.write(f"**Total aircraft: {total_aircraft}**\n\n")
    f.write(f"**RAST: {len(rast)}**\n\n")
    f.write(f"**mRAST: {len(mrast)}**\n\n")

    f.write("## RAST:\n")
    for i in rast:
        write_aircraft(f, i)

    f.write("## mRAST:\n")
    for i in mrast:
        write_aircraft(f, i)

with open("incomplete.txt", "w+") as f:
    for i in rast:
        if len(i["identification"]) == 0:
            f.write(f"{i['name']}\n")

    for i in mrast:
        if len(i["identification"]) == 0:
            f.write(f"{i['name']}\n")
