import Cell from './cell.js';

export default class Map {
    constructor(rows, cols, cellSize) {
        this.cellSize = cellSize;
        this.obstacles = [];
        this.map = [];

        for (let r = 0; r < rows; r++) {
            this.map[r] = [];
            for (let c = 0; c < cols; c++) {
                this.map[r].push(new Cell('empty'));
            }
        }
    }

    toString() {
        let str = '';
        for (let r = 0; r < this.map.length; r++) {
            for (let c = 0; c < this.map[r].length; c++) {
                let type = this.map[r][c].getType();
                if (type == 'empty') {
                    str += '. ';
                } else if (type == 'obstacle') {
                    str += '0 ';
                }
            }
            str += '\n';
        }
        return str;
    }

    generateObstacles(amnt, minLen, maxLen, maxTries) {
        let next = (or, ro, co) => {
            switch (or) {
                case 0:
                    // up
                    return { r: ro - 1, c: co };
                case 1:
                    // down
                    return { r: ro + 1, c: co };
                case 2:
                    // left
                    return { r: ro, c: co - 1 };
                case 3:
                    // right
                    return { r: ro, c: co + 1 };
            }
        };

        let canFit = (size, orient, startR, startC) => {
            let rc = { r: startR, c: startC };

            for (let i = 0; i < size; i++) {
                if (rc.r < 0 || rc.r >= this.map.length || rc.c < 0 || rc.c >= this.map[0].length) return false;
                if (this.map[rc.r][rc.c].getType() != 'empty') return false;

                rc = next(orient, rc.r, rc.c);
            }

            return true;
        };

        let amntDone = 0;
        for (let i = 0; i < maxTries && amntDone < amnt; i++) {
            let randSize = Math.floor(Math.random() * (maxLen - minLen + 1) + minLen);
            let randOrientation = Math.floor(Math.random() * 4);
            let randRow = Math.floor(Math.random() * this.map.length);
            let randCol = Math.floor(Math.random() * this.map[0].length);

            if (canFit(randSize, randOrientation, randRow, randCol)) {
                amntDone++;

                let rc = { r: randRow, c: randCol };

                for (let i = 0; i < randSize; i++) {
                    this.map[rc.r][rc.c].setType('obstacle');
                    rc = next(randOrientation, rc.r, rc.c);
                }

                this.obstacles.push({ r: randRow, c: randCol, numCells: randSize, orientation: randOrientation });
            }
        }
    }

    getObstacleHitboxes() {
        let obstacleHitboxes = [];
        for (let i = 0; i < this.obstacles.length; i++) {
            let obstacle = this.obstacles[i];

            switch (this.obstacles[i].orientation) {
                case 0:
                    // up
                    obstacleHitboxes.push({
                        x: obstacle.c * this.cellSize,
                        y: (obstacle.r - obstacle.numCells) * this.cellSize,
                        w: this.cellSize,
                        h: obstacle.numCells * this.cellSize
                    });
                    break;
                case 1:
                    // down
                    obstacleHitboxes.push({
                        x: obstacle.c * this.cellSize,
                        y: obstacle.r * this.cellSize,
                        w: this.cellSize,
                        h: obstacle.numCells * this.cellSize
                    });
                    break;
                case 2:
                    // left
                    obstacleHitboxes.push({
                        x: (obstacle.c - obstacle.numCells) * this.cellSize,
                        y: obstacle.r * this.cellSize,
                        w: obstacle.numCells * this.cellSize,
                        h: this.cellSize
                    });
                    break;
                case 3:
                    // right
                    obstacleHitboxes.push({
                        x: obstacle.c * this.cellSize,
                        y: obstacle.r * this.cellSize,
                        w: obstacle.numCells * this.cellSize,
                        h: this.cellSize
                    });
                    break;
            }
        }

        return obstacleHitboxes;
    }
}
