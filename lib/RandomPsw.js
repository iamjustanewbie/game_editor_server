const RandomPsw = {
    randomNum: function (len) {
        let res = [];
        for (let i = 0; i < len; i++) {
            res[i] = this.getRandomChar(this.PswNum);
        }
        return res.join("");
    },

    randomUpLowNum: function (len) {
        if (len < 3) {
            return null;
        }
        let numLower = Math.floor(Math.random() * (len - 2)) + 1;
        let numUpper = Math.floor(Math.random() * (len - numLower - 1)) + 1;
        let posList = this.getRandomSequence(len);
        let res = new Array(len);
        for (let i = 0; i < len; i++) {
            if (i < numLower) {
                res[posList[i]] = this.getRandomChar(this.PswLower);
            } else if (i < numLower + numUpper) {
                res[posList[i]] = this.getRandomChar(this.PswUpper);
            } else {
                res[posList[i]] = this.getRandomChar(this.PswNum);
            }
        }
        return res.join("");
    },

    randomUpLowNumChar: function (len) {
        if (len < 4) {
            return null;
        }
        let numLower = Math.floor(Math.random() * (len - 3)) + 1;
        let numUpper = Math.floor(Math.random() * (len - numLower - 2)) + 1;
        let numNum = Math.floor(Math.random() * (len - numLower - numUpper - 1)) + 1;
        let posList = this.getRandomSequence(len);
        let res = new Array(len);
        for (let i = 0; i < len; i++) {
            if (i < numLower) {
                res[posList[i]] = this.getRandomChar(this.PswLower);
            } else if (i < numLower + numUpper) {
                res[posList[i]] = this.getRandomChar(this.PswUpper);
            } else if (i < numLower + numUpper + numNum) {
                res[posList[i]] = this.getRandomChar(this.PswNum);
            } else {
                res[posList[i]] = this.getRandomChar(this.PswChar);
            }
        }
        return res.join("");
    },

    PswNum: "0123456789",
    PswUpper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    PswLower: "abcdefghijklmnopqrstuvwxyz",
    PswChar: "!@#$%^&*()",

    getRandomChar: function (source) {
        return source.charAt(Math.floor(Math.random() * source.length));
    },

    getRandomSequence: function (len) {
        let input = new Array(len);
        let output = new Array(len);
        let i, end = len;
        for (i = 0; i < len; i++) {
            input[i] = i;
        }
        for (i = 0; i < len; i++) {
            let temp = Math.floor(Math.random() * end);
            output[i] = input[temp];
            input[temp] = input[end - 1];
            end--;
        }
        return output;
    }
};

module.exports = RandomPsw;