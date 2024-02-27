#program name TestbedSampleContract
#program description A simple contract with some methods as example
#program activationAmount 2000_0000

#pragma maxAuxVars 3
#pragma verboseAssembly
#pragma optimizationLevel 3
#pragma version 2.2.1

// Magic codes for methods
#define FORWARD_PERCENTAGE 1
#define UPDATE_PERCENTAGE 2
#define SET_MAP_VALUE 3
#define PULL_FUNDS 4

#define MAP_KEY_EXAMPLE 1

long percentage;
long text;

// Define values if not running on testbed (i.e. in web based simulator)
#ifdef TESTBED
    const percentage = TESTBED_percentage;
    const text = TESTBED_text;
#endif

// INTERNALS
struct TXINFO {
    long txId;
    long sender;
    long message[4];
} currentTx;

constructor();

void main () {
    // loops over the transactions of the current block
    while ((currentTx.txId = getNextTx()) != 0) {
        currentTx.sender = getSender(currentTx.txId);
        readMessage(currentTx.txId, 0, currentTx.message);
            switch(currentTx.message[0]){
                case FORWARD_PERCENTAGE:
                    // 2nd argument is the recipients Id.
                    forwardPercentage(currentTx.message[1]);
                    break;
                case UPDATE_PERCENTAGE:
                    // 2nd argument percentage (0-100) to be used by FORWARD_PERCENTAGE
                    updatePercentage(currentTx.message[1]);
                    break;
                case SET_MAP_VALUE:
                    // uses 2nd argument of a message as 2nd key, and 3rd argument as value
                    setMapValue(MAP_KEY_EXAMPLE, currentTx.message[1], currentTx.message[2]);
                    break;
                case PULL_FUNDS:
                    // uses 2nd argument of a message as 2nd key, and 3rd argument as value
                    pullFunds(currentTx.message[1]);
                    break;

            }
    }
};


void constructor() {
};

void catch() {
  asm {
    JMP :__fn_main
  }
}

void pullFunds(long tokenId){
    if(currentTx.sender != getCreator()){
        return;
    }
    if(tokenId == 0){
        sendBalance(getCreator());
    }
    else {
        sendQuantity(getAssetBalance(tokenId), tokenId, getCreator());
    }
}

void updatePercentage(long newPercentage){
    if(currentTx.sender != getCreator()){
        return;
    }

    if(newPercentage > 100){
        percentage = 100;
    }
    else if(newPercentage < 0){
        percentage = 0;
    }
    else {
        percentage = newPercentage;
    }
}

void forwardPercentage(long recipientId) {
    if(percentage == 0) {
        return;
    }
    long amount = getAmount(currentTx.txId);
    sendAmount((amount * percentage)/100, recipientId);
}
