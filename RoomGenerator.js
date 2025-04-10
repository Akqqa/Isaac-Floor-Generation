// So the basic plan is:
// Randomly select a floor, curse if applicable, etc ( do lter, for now, just do most basic as poc )
// Randomly gen the number of rooms
// Select the min dead ends
// Generate according to the original script, and then verify it fits on the grid and has at least min dead ends
// Perform logic for boss room, treasure room, etc if wanted
// secret rooms when required
// thats the generator done! can buildother stuf on top later
// large rooms and such arent necessary. cause gameplay doesnt matter rn lol m- this is basic. worst case can add later if really want to but not well documented.
// ^ issue here is that, this algorithm wont have rock info and stuff, so.. its not super useful. but - again we dont know the game so would have to fake it anyway e.g select certain rooms that we know arent next to a secret room and say they have rocks on that side etc. - thats for gamifying it later
// for rocks, go through and randomly assign "above blocked" "left blocked" etc to places where they can be blocked. this then narrows it down more. but make surenitiss liek 50 percent change or less even idk
// It doesnt have to be perfect :) its jsut for fun !!! and for a small project to get you back into coding for fun like uni
// Can add ultra secret once done for extra challenge, will require red rooms filling all empty space, then using connection rules
// Gameplay can be like, first guess is nothing, each fail reveals new info such as boss room, rooms with blocked sides, etc.

// Using https://bindingofisaacrebirth.fandom.com/wiki/Level_Generation and https://www.boristhebrave.com/2020/09/12/dungeon-generation-in-binding-of-isaac/ for algorithm

// Can be boss, secret, shop, etc etc etc
// Possibility for large rooms - each grid cell contains one room as usual, but can be duplicated in case of larger rooms with copies of the same object. hm. but then pos is weird. and so is getting neighbours. hm
class Room{
    constructor(posY, posX) {
        this.type = "empty";
        this.posY = posY;
        this.posX = posX;
        this.deadEnd = false;
        this.neighbours = [];
        this.secretWeight = Math.floor(Math.random() * (15 - 10)) + 10;
    }

}

class Generator {
    constructor(stage, labyrinth, lost, hard) {
        this.stage = stage;
        this.labyrinth = labyrinth;
        this.lost = lost;
        this.hard = hard;
        this.numRooms = this.generateNumRooms();
        this.minDeadEnds = this.generateMinDeadEnds();
        this.map = [...Array(13)].map(e => Array(13));
        this.deadEndQueue = [];
    }

    generateNumRooms() {
        // Create number of rooms on stage
        let numRooms = Math.min(20, Math.floor(Math.random(0,1)*2) + 5 + Math.floor(this.stage * (10 / 3)));
        if (this.labyrinth) {
            numRooms = Math.min(45, Math.floor(numRooms * 1.8));
        } else if (this.lost) {
            numRooms += 4;
        }
        // Void check
        if (this.stage == 12) {
            numRooms = 50 + Math.floor(Math.random() * 10);
        }
        // Hard mode check
        if (this.hard) {
            numRooms += 2 + Math.floor(Math.random(0,1)*2);
        }
        console.log(numRooms);
        return numRooms;
    }

    generateMinDeadEnds() {
        // Number of dead ends (minimum)
        let minDeadEnds = 5;
        if (this.stage != 1) {
            minDeadEnds += 1;
        }
        if (this.labyrinth) {
            minDeadEnds += 1;
        }
        if (this.stage == 12) {
            minDeadEnds += 2;
        }
        console.log(minDeadEnds);
        return minDeadEnds;
    }

    // Utility for generating all neighbouring rooms for a given room - prunes those out of bounds
    generateNeighbours(room) {
        let neighbours = [new Room(room.posY + 1, room.posX), new Room(room.posY - 1, room.posX), new Room(room.posY, room.posX + 1), new Room(room.posY, room.posX - 1)];
        let neighboursPruned = [];
        for (let i = 0; i < 4; i++) {
            if (!(neighbours[i].posY < 0 || neighbours[i].posY >= 13 || neighbours[i].posX < 0 || neighbours[i].posX >= 13)) {
                neighboursPruned.push(neighbours[i]);
            }
        }
        return neighboursPruned;
    }

    // Utility for finding existing neighbours
    findNeighbours(room) {
        let coords = [[room.posY + 1, room.posX], [room.posY - 1, room.posX], [room.posY, room.posX + 1], [room.posY, room.posX - 1]]
        let neighbours = [];
        coords.forEach(coord => {
            // In bounds
            if (coord[0] < 0 || coord[0] >= 13 || coord[1] < 0 || coord[1] >= 13) {
                return;
            }
            if (this.map[coord[0]][coord[1]] instanceof  Room) {
                neighbours.push(this.map[coord[0]][coord[1]]);
            }
        });
        return neighbours;
    }

    
    generateLayout() { // Considered a separate map class, but no real point tbh since itd have to pass half the stuff anyway
        let roomsRemaining = this.numRooms;
        // Start at center square
        let center = [6, 6];
        let [centerY, centerX] = center
        let roomQueue = [];
        // Place starting room in queue, and add to grid:
        let startRoom = new Room(centerY,centerX);
        startRoom.type = "start";
        roomQueue.push(startRoom);
        this.map[centerY][centerX] = roomQueue[0];
        roomsRemaining -= 1;
        console.log(this.map[centerY][centerX]);

        // Loop over each room in queue
        let resetCounter = -1;
        while (roomQueue.length != 0) {
            resetCounter += 1;
            if (resetCounter != 0 && resetCounter % 16 == 0) {
                roomQueue.unshift(startRoom);
            }
            // ADD counter so that every 16 rooms the start room is reseeded into queue :)
            let currentRoom = roomQueue.shift();
            // For each coordinate left, up, down, right of this room, see if youll create a new room, and follow game logic to do so. Then add each new room to both the queue and the map
            // (down, up, right, left)
            // MAKE THESE ROOMS!!
            let neighbourList = this.generateNeighbours(currentRoom);
            let roomCounter = 0;
            neighbourList.forEach(neighbour => {
                // Perform checks to see if should generate a room here, and if so, add to queue and grid.
                // Check 1: Is this space already occupied?
                if (this.map[neighbour.posY][neighbour.posX] !== undefined) {
                    return;
                }
                // Check 2: More than one filled neighbour already for this cell?
                let neighbourListSquared = this.generateNeighbours(neighbour);
                let neighbourCounter = 0;
                neighbourListSquared.forEach(neighbourSquared => {
                    if (this.map[neighbourSquared.posY][neighbourSquared.posX] !== undefined) {
                        neighbourCounter += 1;
                    }
                })
                if (neighbourCounter > 1) {
                    // Add a random chance to stop, random to continue. BECAUSE isaac room generation does seem to support multiple adjacent rooms, just rarer..
                    if (this.stage != 12) { //   from manual testing looks like only void allows loops
                        return;
                    }
                    if (neighbour > 2 || Math.random() < 0.9) {
                        return;
                    }
                }
                // Check 3: Rooms left?
                if (roomsRemaining == 0) {
                    return;
                }
                // Check 4: 50% chance
                if (Math.floor(Math.random(0,1)*2) == 0) {
                    return;
                }
                // Create room here
                this.map[neighbour.posY][neighbour.posX] = neighbour;
                roomQueue.push(neighbour);
                roomsRemaining -= 1;
                roomCounter += 1;
            });
            // Blog post says a room is a dead end if it creates no neighbours, but is this true? say one doesnt create any, but later on it loops around and tries to put a room there from the other side. it can do this because no more than 2 already filled neighbours (does allow some loops see void). Therefore must wait till end, manually calculate dead ends, create list, sort by manhattan distance to start room (manhattan? no.. cause could loop around . hm. is there a way of doing it so they loop et it writes dead ends as it goes? AH write them as it goes then do a final pass of them and remove any that dont meet the criteria :) tht keeps it in order !!) - actually basically unnecceesary except for void so do it anyway lol
            if (roomCounter == 0) {
                this.deadEndQueue.push(currentRoom);
            }
        }
    }

    generateMap() {
        while(1 == 1) {
            this.map = [...Array(13)].map(e => Array(13));
            this.deadEndQueue = [];
            this.generateLayout();
            // Check conditions match?
            // First count rooms
            let roomCounter = 0;
            for(let i = 0; i < 13; i++) {
                for(let j = 0; j < 13; j++) {
                    if (this.map[j][i] !== undefined) {
                        roomCounter += 1;
                    }
                }
            }
            if (roomCounter != this.numRooms) {
                continue;
            }
            // Second, verify the dead end queue, and then check the count is correct - this usually takes off one (not sure why) but is needed in void
            let deadEndQueuePruned = []
            this.deadEndQueue.forEach(room => {
                if (room.type == "start") {
                    return;
                }
                let neighbours = this.generateNeighbours(room);
                // If more than one neighbour, not a dead end so remove from queue
                let neighbourCounter = 0;
                neighbours.forEach(neighbour => {
                    if (this.map[neighbour.posY][neighbour.posX] !== undefined) {
                        neighbourCounter += 1;
                    }
                })
                if (neighbourCounter == 1) {
                    deadEndQueuePruned.push(room);
                }
            })
            this.deadEndQueue = deadEndQueuePruned;
            if (this.deadEndQueue.length < this.minDeadEnds) {
                continue;
            }
            break;
        }

        // Now a valid layout has been generated, place rooms in dead ends (for now just do boss, super secret, shop, item) - altho implement more to reduce amount of dead ends!!
        this.deadEndQueue.pop().type = "boss";
        this.deadEndQueue.pop().type = "supersecret";
        if (this.stage < 7) {
            this.deadEndQueue.pop().type = "shop";
            this.deadEndQueue.pop().type = "item"
            if (this.labyrinth) {
                this.deadEndQueue.pop().type = "item";
            }
        } else if (this.stage == 12) {
            // Void - generate 7 more boss rooms lol - can it be more ? idk look into that
            for (let i = 0; i < 7; i++) {
                this.deadEndQueue.pop().type = "boss";
            }
        }


        // Place the secret room.
        // 1. loop through each undefined and create a room for it
        // 2. assign each room a weight based on number of neighbours that are not candidates, or boss rooms, or secret rooms (if boss or secret room, weight = 0)
        // 3. pick highest weight candidate
        let candidates = [];
        for(let i = 0; i < 13; i++) {
            for(let j = 0; j < 13; j++) {
                if (this.map[j][i] === undefined) {
                    let room = new Room(j,i);
                    room.type = "candidate";
                    candidates.push(room);
                }
            }
        }
        candidates.forEach(candidate => {
            let invalidFlag = false;
            let candidateNeighbours = this.findNeighbours(candidate);
            let numNeighbours = 0;
            candidateNeighbours.forEach(neighbour => {
                console.log(neighbour.type);
                if (neighbour.type == "boss" || neighbour.type == "supersecret") {
                    invalidFlag = true;
                    return;
                } 
                numNeighbours += 1;
            });
            console.log("num neighbours:" + numNeighbours);
            if (invalidFlag) {
                candidate.secretWeight = 0;
            } else if (numNeighbours == 2) {
                candidate.secretWeight -= 3;
            } else if (numNeighbours == 1) {
                candidate.secretWeight -= 6
            } else if (numNeighbours == 0) {
                candidate.secretWeight = 0;
            }
            console.log(candidate.secretWeight);
        });
        // Find highest weight candidate (with some randomness for equal weights)
        let topWeight = 0;
        let bestCandidate = undefined;
        candidates.forEach(candidate => {
            if (candidate.secretWeight > topWeight) {
                topWeight = candidate.secretWeight;
                bestCandidate = candidate;
            } else if (candidate.secretWeight == topWeight) {
                // Random chance to replace current best candidate so there isnt a top left bias
                if (Math.random() > 0.5) {
                    //topWeight = candidate.secretWeight;
                    bestCandidate = candidate;
                }
            }
        });
        // Place best candidate in map, others are garbage collected
        bestCandidate.type = "secret";
        this.map[bestCandidate.posY][bestCandidate.posX] = bestCandidate;
        
    }

    printMap() {
        for(let i = 0; i < 13; i++) {
            for(let j = 0; j < 13; j++) {
                if (this.map[j][i] === undefined) {
                    process.stdout.write("   ");
                } else if (this.map[j][i].type == "start") {
                    process.stdout.write("[.]");
                } else if (this.map[j][i].type == "boss") {
                    process.stdout.write("[B]");
                } else if (this.map[j][i].type == "supersecret") {
                    process.stdout.write("[S]");
                } else if (this.map[j][i].type == "secret") {
                    process.stdout.write("[s]");
                } else if (this.map[j][i].type == "shop") {
                    process.stdout.write("[$]");
                } else if (this.map[j][i].type == "item") {
                    process.stdout.write("[I]");
                } else {
                    process.stdout.write("[ ]");
                }
            }
            process.stdout.write("\n");
        }
    }
 
}

let generator = new Generator(12, false, false, false);
generator.generateMap();
generator.printMap();





