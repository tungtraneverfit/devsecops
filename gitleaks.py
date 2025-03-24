import json
import sys

if len(sys.argv) < 3:
    sys.exit(1)

INPUT_SARIF_FILE = sys.argv[1]
# Replace this with the path to your SARIF JSON file
OUTPUT_HTML_FILE = sys.argv[2]

# Load SARIF data
with open(INPUT_SARIF_FILE, "r") as file:
    data = json.load(file)

rows = []
for run in data.get("runs", []):
    for result in run.get("results", []):
        rule_id = result.get("ruleId", "")
        message = result.get("message", {}).get("text", "")
        for location in result.get("locations", []):
            loc = location.get("physicalLocation", {})
            file_path = loc.get("artifactLocation", {}).get("uri", "")
            region = loc.get("region", {})
            line = region.get("startLine", "")
            snippet = region.get("snippet", {}).get("text", "")
            rows.append((rule_id, message, file_path, line, snippet))

# Generate HTML
html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Gitleaks SARIF Report</title>
    <div class="d-flex justify-content-center align-items-center mb-4" style="height: 100px;">
        <h2>Gitleaks SARIF Report</h2>
    </div>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <style>
        table {{
        table-layout: fixed;
        width: 100%;
        }}
        table td {{
            word-wrap: break-word;
            white-space: normal;
            vertical-align: top;
        }}
        .col-rule-id {{ width: 5%; }}
        .col-message {{ width: 25%; }}
        .col-file {{ width: 20%; }}
        .col-line {{ width: 10%; }}
        .col-snippet {{ width: 40%; }}
    </style>
</head>
<body>
<div class="container mt-5">
    <table id="reportTable" class="table table-bordered table-striped">
        <thead>
            <tr>
                <th>Rule ID</th>
                <th>Message</th>
                <th>File</th>
                <th>Line</th>
                <th>Snippet</th>
            </tr>
        </thead>
        <tbody>
"""

for rule_id, message, file_path, line, snippet in rows:
    html += f"""
        <tr>
            <td>{rule_id}</td>
            <td>{message}</td>
            <td>{file_path}</td>
            <td>{line}</td>
            <td><code>{snippet}</code></td>
        </tr>
    """

html += """
        </tbody>
    </table>
</div>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
<script>
    $(document).ready(function () {
        $('#reportTable').DataTable({
            pageLength: 10
        });
    });
</script>
</body>
</html>
"""

with open(OUTPUT_HTML_FILE, "w") as file:
    file.write(html)

print(f"HTML report written to {OUTPUT_HTML_FILE}")