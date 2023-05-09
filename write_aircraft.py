# Creates a markdown file with aircraft information from air_rec.json

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
Spec: {'mRAST' if data['mrast'] else 'RAST'}
**Aliases:**
{"".join(aliases)}
"""
    )


with open("src/air_rec.json") as f:
    data = json.load(f)

with open("aircraft.md", "w+") as f:
    total_aircraft = len(data["civilian"]) + len(data["military"])
    f.write(f"**Total aircraft: {total_aircraft}**\n\n")

    f.write("## Civilian:\n")
    for i in data["civilian"]:
        write_aircraft(f, i)

    f.write("## Military:\n")
    for i in data["military"]:
        write_aircraft(f, i)

with open("incomplete.txt", "w+") as f:
    for i in data["civilian"]:
        if len(i["identification"]) == 0:
            f.write(f"{i['name']}\n")

    for i in data["military"]:
        if len(i["identification"]) == 0:
            f.write(f"{i['name']}\n")
