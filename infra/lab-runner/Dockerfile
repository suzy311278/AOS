# ArmorInnovate Lab Runner — Ephemeral PLC Simulator Container
#
# Boots a mock PLC environment for hands-on lab exercises. The runtime
# is selected via LAB_RUNTIME env var. Supported runtimes:
#
#   pymodbus-simulator  — Modbus/TCP server (port 502)
#   snap7-simulator     — S7comm server (port 102)
#   cpppo-simulator     — EtherNet/IP server (port 44818)
#   iec104-simulator    — IEC 60870-5-104 server (port 2404)
#   opc-ua-mock         — OPC-UA server (port 4840)
#
# Usage:
#   docker build -t armor-lab-runner .
#   docker run --rm -e LAB_RUNTIME=pymodbus-simulator -p 502:502 armor-lab-runner
#
# The container is designed to be ephemeral: spin up per-session, tear
# down on disconnect or timeout. No persistent state.

FROM python:3.12-slim

LABEL org.opencontainers.image.title="ArmorInnovate Lab Runner"
LABEL org.opencontainers.image.description="Ephemeral PLC simulator for ICS security labs"

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    tshark \
    nmap \
    netcat-openbsd \
    iproute2 \
    iputils-ping \
    tcpdump \
    && rm -rf /var/lib/apt/lists/*

# Python PLC simulators
RUN pip install --no-cache-dir \
    pymodbus[serial]==3.7.4 \
    python-snap7==1.4.1 \
    cpppo==4.4.3 \
    opcua==0.98.13

# Lab toolkit (CLI tools for students)
RUN pip install --no-cache-dir \
    mbtget==1.1.1 || true

WORKDIR /lab

# Copy entrypoint
COPY entrypoint.sh /lab/entrypoint.sh
RUN chmod +x /lab/entrypoint.sh

# Default env
ENV LAB_RUNTIME=pymodbus-simulator
ENV LAB_TIMEOUT=1800

# Expose common ICS ports
EXPOSE 502 102 44818 2404 4840

ENTRYPOINT ["/lab/entrypoint.sh"]
