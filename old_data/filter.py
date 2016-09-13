import sys

def filter(data):
  users = ["A2T893QOA0QILP","A149ROBL26JWPJ","ABUXM7VAW5SKJ","42136","44404","A2RRC5B4M80XXO","A375OH1S7FO7L8","A3EPDU2O2JMR50","A9HQ3E0F2AGVO","A15781PHGW377Y","A9GNNAGBWOFAM","39661"]

  input_file = open(data, 'r')
  output_file = open(data.split('.')[0] + '_output.json', 'w')

  for line in input_file:
    for user in users:
      if user in line:
        output_file.write(line)

  input_file.close()
  output_file.close()

def main(argv):
  filter(argv[1])

if __name__ == "__main__":
  main(sys.argv)

