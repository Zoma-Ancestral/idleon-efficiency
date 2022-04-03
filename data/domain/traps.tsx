
export enum TrapSet {
    Cardboard = 0,
    Silkskin = 1,
    Wooden = 2,
    Natural = 3,
    Steel = 4
}

const trapBoxInfo = [
    [
        [1200, 1, 1, 0],
        [3600, 2, 2, 0],
        [28800, 10, 8, 0],
        [72e3, 20, 15, 0],
    ],
    [
        [1200, 1, 2, 1],
        [3600, 2, 4, 1],
        [28800, 10, 16, 1],
        [72e3, 20, 30, 1],
        [144e3, 35, 50, 1],
    ],
    [
        [10800, 5, 5, 0],
        [216e3, 50, 40, 0],
        [432e3, 100, 80, 0],
        [432e3, 200, 0, 0],
        [432e3, 0, 200, 0],
    ],
    [
        [28800, 0, 40, 0],
        [72e3, 0, 75, 0],
        [158e3, 0, 120, 0],
        [518e3, 0, 350, 0],
    ],
    [
        [10800, 5, 10, 1],
        [216e3, 50, 80, 1],
        [432e3, 100, 160, 1],
        [72e3, 1, 60, 1],
    ],
    [
        [3600, 3, 3, 0],
        [36e3, 15, 12, 0],
        [108e3, 40, 30, 0],
        [72e4, 220, 200, 0],
    ],
    [
        [1200, 2, 4, 1],
        [3600, 4, 8, 1],
        [36e3, 21, 38, 1],
        [144e3, 70, 125, 1],
        [576e3, 250, 375, 1],
        [2419e3, 550, 1150, 1],
    ],
];

export class Trap {
    playerID: number;
    critterName: string;
    timeSincePut: number;
    trapDuration: number;
    trapType: TrapSet;

    constructor(playerID: number, trapArray: Array<any>) {
        this.playerID = playerID;
        this.critterName = trapArray[3];
        this.timeSincePut = trapArray[2];
        this.trapDuration = trapArray[6];
        this.trapType = trapArray[5];
    }

    isReady = () => {
        return this.timeSincePut >= this.trapDuration;
    }

    getBenefits = () => {
        const boxData = trapBoxInfo[this.trapType].find(info => Math.round(info[0]) == Math.round(this.trapDuration));
        if (this.playerID == 5) {
            console.log(this.playerID, this.trapType, this.trapDuration, boxData);
        }
        if (boxData) {
            if (boxData[3] == 0) {
                return [`x${Math.round(boxData[1] * 10) / 10} Qty`, `x${Math.round(boxData[2] * 10) / 10} Exp`]
            }
            if (boxData[3] == 1) {
                return [`x${Math.round(boxData[1] * 10) / 10} Qty`, `x${Math.round(boxData[2] * 10) / 10} Shiny`]
            }
        }
        return [];
    }
}


export default function parseTraps(allTraps: Array<any>) {

    const parsedData = allTraps.map((playerArray, pIndex) => {
        try {
            const parsedPlayerData: Array<any> = JSON.parse(playerArray);
            const filteredTraps = parsedPlayerData.filter(trapData => trapData[0] != -1);
            return filteredTraps.map(trapData => {
                return new Trap(pIndex, trapData)
            });
        }
        catch {
            return [];
        }
    });
    return parsedData;
}