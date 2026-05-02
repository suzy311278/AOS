#!/bin/sh
set -eu

echo "╔══════════════════════════════════════════╗"
echo "║  ArmorInnovate Lab Runner                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "[boot] Runtime:  ${LAB_RUNTIME:-pymodbus-simulator}"
echo "[boot] Timeout:  ${LAB_TIMEOUT:-1800}s"
echo "[boot] PID:      $$"
echo ""

# Auto-shutdown after LAB_TIMEOUT seconds
(sleep "${LAB_TIMEOUT:-1800}" && echo "[timeout] Session expired." && kill -TERM $$ 2>/dev/null) &
TIMER_PID=$!

cleanup() {
  echo "[shutdown] Cleaning up…"
  kill "$TIMER_PID" 2>/dev/null || true
  exit 0
}
trap cleanup TERM INT

case "${LAB_RUNTIME:-pymodbus-simulator}" in
  pymodbus-simulator)
    echo "[boot] Starting Modbus/TCP server on port 502…"
    python3 -c "
from pymodbus.server import StartTcpServer
from pymodbus.datastore import (
    ModbusSequentialDataBlock,
    ModbusSlaveContext,
    ModbusServerContext,
)

# Create a data store with some initial values
store = ModbusSlaveContext(
    di=ModbusSequentialDataBlock(0, [0]*100),    # Discrete Inputs
    co=ModbusSequentialDataBlock(0, [0]*100),    # Coils
    hr=ModbusSequentialDataBlock(0, list(range(100))),  # Holding Registers
    ir=ModbusSequentialDataBlock(0, [0]*100),    # Input Registers
)
context = ModbusServerContext(slaves={1: store, 2: store}, single=False)

print('[modbus] Server ready on 0.0.0.0:502')
print('[modbus] Slave IDs: 1, 2')
print('[modbus] Holding registers: 40001-40100 (pre-filled 0-99)')
print('[modbus] Coils: 00001-00100')

StartTcpServer(context=context, address=('0.0.0.0', 502))
"
    ;;

  snap7-simulator)
    echo "[boot] Starting S7comm server on port 102…"
    python3 -c "
import snap7
import time

server = snap7.server.Server()
size = 1024

# Create data blocks
db1 = (snap7.types.wordlen_to_ctypes[snap7.types.S7WLByte] * size)()
server.register_area(snap7.types.srvAreaDB, 1, db1)

server.start(tcpport=102)
print('[s7comm] Server ready on 0.0.0.0:102')
print('[s7comm] DB1 registered (1024 bytes)')

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    server.stop()
    server.destroy()
" 2>/dev/null || echo "[error] snap7 server failed to start (library may not be available)"
    ;;

  cpppo-simulator)
    echo "[boot] Starting EtherNet/IP server on port 44818…"
    python3 -m cpppo.server.enip --print --address 0.0.0.0:44818 \
      "SCADA=INT[100]" "Status=DINT" "Setpoint=REAL" \
      2>&1 || echo "[error] cpppo server failed"
    ;;

  iec104-simulator)
    echo "[boot] IEC 60870-5-104 simulator not yet implemented."
    echo "[boot] Entering sleep mode — connect via the mock runtime."
    sleep infinity
    ;;

  opc-ua-mock)
    echo "[boot] Starting OPC-UA server on port 4840…"
    python3 -c "
from opcua import Server
import time

server = Server()
server.set_endpoint('opc.tcp://0.0.0.0:4840/armorinnovate/lab')
server.set_server_name('ArmorInnovate Lab OPC-UA')

uri = 'urn:armorinnovate:lab'
idx = server.register_namespace(uri)

objects = server.get_objects_node()
plc = objects.add_object(idx, 'PLC')
temp = plc.add_variable(idx, 'Temperature', 25.0)
pressure = plc.add_variable(idx, 'Pressure', 101.3)
valve = plc.add_variable(idx, 'ValveOpen', True)
temp.set_writable()
pressure.set_writable()
valve.set_writable()

server.start()
print('[opc-ua] Server ready on opc.tcp://0.0.0.0:4840')
print('[opc-ua] Namespace:', uri)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    server.stop()
" 2>/dev/null || echo "[error] OPC-UA server failed"
    ;;

  *)
    echo "[error] Unknown runtime: ${LAB_RUNTIME}"
    echo "[error] Supported: pymodbus-simulator, snap7-simulator, cpppo-simulator, iec104-simulator, opc-ua-mock"
    exit 1
    ;;
esac
