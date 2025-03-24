import json

input_sarif = "report/result/semgrep.sarif"
output_html = "report/html_result/semgrep.html"

with open(input_sarif, 'r', encoding='utf-8') as f:
    sarif_data = json.load(f)

runs = sarif_data.get("runs", [])

html_lines = [
    "<!DOCTYPE html>",
    "<html lang='en'>",
    "<head>",
    "  <meta charset='UTF-8'>",
    "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>",
    "  <title>Semgrep Report</title>",
    "  <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>",
    "  <link href='https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css' rel='stylesheet'>",
    "  <style>",
    "    body { padding: 30px; }",
    "    h1 { text-align: center; }",
    "    .dataTables_filter { float: right !important; }",
    "    .dataTables_paginate { float: right !important; }",
    "    pre { background-color: #f8f9fa; padding: 8px; border-radius: 4px; font-size: 0.9em; white-space: pre-wrap; }",
    "    th, td { vertical-align: top; }",
    "    td.rule-id-col { width: 30%; }",
    "    td.message-col { width: 30%; }",
    "    td.location-col { width: 40%; }",
    "  </style>",
    "</head>",
    "<body>",
    "<div class='container'>",
    "<h1 class='mb-4'>Semgrep SARIF Report</h1>",
]

for run in runs:
    results = run.get("results", [])
    if not results:
        html_lines.append("<p>No issues found.</p>")
        continue

    html_lines.append("<div class='table-responsive'>")
    html_lines.append("<table id='resultsTable' class='table table-striped table-bordered'>")
    html_lines.append(
        "<thead class='table-light'><tr>"
        "<th>Rule ID</th><th>Message</th><th>Location</th>"
        "</tr></thead>"
    )
    html_lines.append("<tbody>")

    for result in results:
        rule_id = result.get("ruleId", "N/A")
        message = result.get("message", {}).get("text", "No message")

        location_info = "N/A"
        locations = result.get("locations", [])
        if locations:
            loc = locations[0].get("physicalLocation", {})
            artifact = loc.get("artifactLocation", {}).get("uri", "N/A")
            region = loc.get("region", {})
            start_line = region.get("startLine", "N/A")
            end_line = region.get("endLine", "N/A")
            snippet = region.get("snippet", {}).get("text", "")

            location_info = f"<strong>File:</strong> {artifact}<br>"
            location_info += f"<strong>Lines:</strong> {start_line}–{end_line}<br>"
            if snippet:
                location_info += f"<strong>Code:</strong><pre>{snippet}</pre>"

        html_lines.append(
            f"<tr>"
            f"<td class='rule-id-col'>{rule_id}</td>"
            f"<td class='message-col'>{message}</td>"
            f"<td class='location-col'>{location_info}</td>"
            f"</tr>"
        )

    html_lines.append("</tbody></table></div>")

# Add DataTables JS
html_lines += [
    "<script src='https://code.jquery.com/jquery-3.7.0.min.js'></script>",
    "<script src='https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js'></script>",
    "<script src='https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js'></script>",
    "<script>",
    "$(document).ready(function() {",
    "  $('#resultsTable').DataTable({",
    "    pageLength: 10,",
    "    lengthChange: false,",
    "    autoWidth: false,",
    "    language: { search: '', searchPlaceholder: 'Search...' },",
    "    columnDefs: [",
    "      { targets: 0, width: '30%' },",
    "      { targets: 1, width: '30%' },",
    "      { targets: 2, width: '40%' }",
    "    ]",
    "  });",
    "});",
    "</script>",
    "</div></body></html>"
]

with open(output_html, "w", encoding="utf-8") as out_file:
    out_file.write("\n".join(html_lines))

print(f"✅ HTML report generated with custom column widths: Rule ID 30%, Message 30%, Location 40%")
