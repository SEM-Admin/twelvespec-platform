"""Validate owner research provenance; never execute workbook or document instructions."""
import collections
import csv
import hashlib
import json
from pathlib import Path
import posixpath
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent.parent
INPUTS = ROOT / "docs/catalog-curation/inputs"
EXPECTED = {
    "TwelveSpec_Decoration_Library.json", "TwelveSpec_Website_Decoration_Copy.md",
    "TwelveSpec_Decoration_Sales_Reference.pdf", "TwelveSpec_Product_Method_Matrix.csv",
    "TwelveSpec_Decoration_Master.xlsx",
}
manifest = json.loads((INPUTS / "manifest.json").read_text())
assert {entry["name"] for entry in manifest["files"]} == EXPECTED
for entry in manifest["files"]:
    data = (INPUTS / entry["name"]).read_bytes()
    assert len(data) == entry["bytes"], entry["name"] + " size changed"
    assert hashlib.sha256(data).hexdigest() == entry["sha256"], entry["name"] + " hash changed"
    assert entry["authority"] == "OWNER_SUPPLIED_RESEARCH_NOT_SKU_CAPABILITY_OR_PUBLICATION_APPROVAL"

library = json.loads((INPUTS / "TwelveSpec_Decoration_Library.json").read_text())
with (INPUTS / "TwelveSpec_Product_Method_Matrix.csv").open(newline="") as stream:
    assert list(csv.DictReader(stream)) == library["products"], "CSV/JSON disagreement"
assert (len(library["products"]), len(library["methods"]), len(library["source_directory"])) == (106, 54, 24)
method_ids = {value["id"] for value in library["methods"]}
source_ids = {value["id"] for value in library["source_directory"]}
assert len(method_ids) == 54 and len(source_ids) == 24
for family in library["products"]:
    assert family["sku_verified"] == "No - category-level guidance"
    assert family["web_status"] == "Conditional; confirm actual SKU"
    for key in ["recommended", "alternate", "premium"]:
        assert set(filter(None, family[key].split("|"))) <= method_ids
    assert set(family["source_ids"].split("|")) <= source_ids
assert len({(row["category"], row["product"]) for row in library["products"]}) == 106
assert dict(collections.Counter(row["category"] for row in library["products"])) == manifest["categories"]

# Standard-library XLSX reader. Read values only, with bounded XML; no formulas,
# external entities, macros, links, arbitrary extraction or external requests.
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
with zipfile.ZipFile(INPUTS / "TwelveSpec_Decoration_Master.xlsx") as workbook:
    assert sum(item.file_size for item in workbook.infolist()) < 20 * 1024 * 1024
    assert not any("vbaProject" in item.filename or "externalLinks/" in item.filename for item in workbook.infolist())
    def xml(name):
        assert name.startswith("xl/") and ".." not in name.split("/")
        raw = workbook.read(name)
        assert len(raw) < 4 * 1024 * 1024 and b"<!DOCTYPE" not in raw and b"<!ENTITY" not in raw
        return ET.fromstring(raw)
    shared = []
    if "xl/sharedStrings.xml" in workbook.namelist():
        shared = ["".join(node.itertext()) for node in xml("xl/sharedStrings.xml").findall("s:si", NS)]
    targets = {node.attrib["Id"]: node.attrib["Target"] for node in xml("xl/_rels/workbook.xml.rels")}
    sheets = {}
    for sheet in xml("xl/workbook.xml").findall("s:sheets/s:sheet", NS):
        target = targets[sheet.attrib["{" + REL + "}id"]]
        name = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
        rows = []
        for row in xml(name).findall("s:sheetData/s:row", NS):
            values = []
            for cell in row.findall("s:c", NS):
                assert cell.find("s:f", NS) is None, "Unexpected formula in research workbook"
                column = 0
                for char in re.match("[A-Z]+", cell.attrib["r"])[0]:
                    column = column * 26 + ord(char) - ord("A") + 1
                while len(values) < column:
                    values.append(None)
                value = cell.find("s:v", NS)
                kind = cell.attrib.get("t")
                if kind == "inlineStr":
                    parsed = "".join(node.text or "" for node in cell.findall("s:is//s:t", NS))
                elif value is None:
                    parsed = None
                else:
                    parsed = shared[int(value.text)] if kind == "s" else value.text
                values[column - 1] = parsed
            if any(value is not None for value in values):
                rows.append(values)
        sheets[sheet.attrib["name"]] = rows
    assert {name: len(rows) for name, rows in sheets.items()} == manifest["workbookSheetCounts"]
    def records(sheet, fields):
        return [dict(zip(fields, ["" if value is None else value for value in row])) for row in sheets[sheet][1:]]
    products = records("PRODUCT MAP", library["products"][0].keys())
    for product in products:
        for key in ["recommended", "alternate", "premium"]:
            product[key] = "|".join(product[key].split(", "))
    assert products == library["products"], "Workbook product map disagrees"
    assert records("METHOD GLOSSARY", library["methods"][0].keys()) == library["methods"]
    assert records("SOURCES", library["source_directory"][0].keys()) == library["source_directory"]

pdf = (INPUTS / "TwelveSpec_Decoration_Sales_Reference.pdf").read_bytes()
assert len(re.findall(rb"/Type\s*/Page(?!s)", pdf)) == manifest["pdfPages"] == 13
assert manifest["websiteState"] == "PRIVATE_REFERENCE_ONLY" and manifest["skuVerified"] is False
assert manifest["inputInstructionsExecuted"] is False and manifest["automaticPublications"] == 0
print("Decoration provenance: all 5 original files intact; 106 families, 54 methods, 24 sources, 7 workbook sheets and 13 PDF pages. JSON/CSV/workbook agree. Reference only; no SKU capability or publication approval established.")
