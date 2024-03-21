# /bin/bash
# Send a get-Request to the API to check if there are any matches in the database. If There are already matches in the database, exit the script.
RESP=`curl -X GET http://backend:80/api/match`
if [ $RESP != "[]" ]
then
  exit
fi

#### Send matches
jq -c '.[]' data/15_matches.json | while read i; do
    echo $i
    curl -i -X POST -H 'Content-Type: application/json' --data $i http://backend:80/api/match
done

#### Send Teams
curl -X POST -F name=Cyrus2023_IranOpen -F zip=@data/Cyrus2023_IranOpen.zip http://backend:80/api/team
curl -X POST -F name=FRA-UNIted_noCoach -F zip=@data/FRA-UNIted_noCoach.zip http://backend:80/api/team

#### Send Protocols
# Set the API endpoint
API_ENDPOINT="http://backend:80/api/protocol"

# Input file containing JSON entries
INPUT_FILE="data/3_protocols.jsonl"

# Check if the input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo "Input file not found: $INPUT_FILE"
    exit 1
fi

# Read each JSON entry from the file and send a POST request
while IFS= read -r json_entry; do
    # Make the POST request using curl
    curl -X POST \
        -H "Content-Type: application/json" \
        -d "$json_entry" \
        "$API_ENDPOINT"

    # Add a newline for better readability in the output
    echo ""
done < "$INPUT_FILE"
