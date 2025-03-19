docker run -v $(pwd):/zap/wrk/:rw --network="host" zaproxy/zap-stable zap-baseline.py \
  -t https://abc-dev3.abc.io/ \
  -r scan-report.html \
  -z "injectheader='x-access-token: '"