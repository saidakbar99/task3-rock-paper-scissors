const readline = require('readline-sync')
const crypto = require('crypto')

class MoveRules {
    constructor(moves) {
        this.moves = moves
    }

    determineWinner(userMove, computerMove) {
        const totalMoves = this.moves.length
        const halfMoves = Math.floor(totalMoves / 2)
        const result = Math.sign((userMove - computerMove + halfMoves + totalMoves) % totalMoves - halfMoves)

        if (result === 0) {
            return 'Draw!'
        }

        if (result > 0) {
            return 'You Win!'
        }

        return 'Computer Wins!'
    }
}

class KeyGenerator {
    static generateKey() {
        return crypto.randomBytes(32).toString('hex')
    }

    static generateHMAC(key, computerMove) {
        return crypto.createHmac('sha256', key).update(computerMove).digest('hex')
    }
}

class TableGenerator {
    static generateTable(moves) {
        const table = this.initializeTable(moves)

        this.fillTable(table, moves)

        const columnLengths = this.getColumnLengths(table)

        const newTable = this.formatTable(table, columnLengths)

        return newTable.join('\n')
    }

    static initializeTable(moves) {
        const table = [['Moves', ...moves]]

        for (const move of moves) {
            const row = [move, ...Array(moves.length).fill('-')]
            table.push(row)
        }

        return table
    }

    static fillTable(table, moves) {
        for (let i = 1; i < table.length; i++) {
            for (let j = 1; j < table[i].length; j++) {
                if (i === j) {
                    table[i][j] = 'Draw'
                } else {
                    const result = new MoveRules(moves).determineWinner(table[i][0], table[0][j])
                    table[i][j] = result
                    table[j][i] = result === 'Draw' ? 'Draw' : result === 'User Wins' ? 'Computer Wins' : 'User Wins'
                }
            }
        }
    }

    static getColumnLengths(table) {
        return table.reduce((acc, row) => {
            row.forEach((col, index) => {
                acc[index] = Math.max(acc[index] || 0, col.length)
            })
            return acc
        }, [])
    }

    static padString(str, length) {
        return ' '.repeat((length - str.length) / 2) + str + ' '.repeat((length - str.length + 1) / 2)
    }

    static formatTable(table, columnLengths) {
        const formattedTable = table.map(row =>
            '| ' + row.map((col, index) => this.padString(col, columnLengths[index])).join(' | ') + ' |'
        )

        formattedTable.splice(1, 0, formattedTable[0].replace(/[^|]/g, '—'))
        formattedTable.splice(0, 0, formattedTable[0].replace(/[^|]/g, '—'))
        formattedTable.splice(formattedTable.length, 0, formattedTable[0].replace(/[^|]/g, '—'))

        return formattedTable
    }
}

class Game {
    constructor(moves) {
        this.moves = moves
        this.computerMoveId = Math.floor(Math.random() * moves.length)
        this.computerMove = moves[this.computerMoveId]
        this.moveRules = new MoveRules(moves)
        this.key = KeyGenerator.generateKey()
        this.hmac = KeyGenerator.generateHMAC(this.key, this.computerMove)
        this.table = TableGenerator.generateTable(moves)
    }

    start() {
        console.log('====================Start====================')
        console.log('HMAC:', this.hmac)
        this.play()
    }

    play() {
        console.log('Available moves:')
        moves.forEach((move, i) => console.log(`${i + 1} - ${move}`))
        console.log('0 - exit')
        console.log('? - help')

        const userMove = readline.question('Enter your move: ')

        switch(userMove) {
            case '0':
                console.log('====================Finish====================')
                process.exit(1)
            case '?':
                console.table(this.table)
                return this.play()
            default:
                if (!moves.includes(userMove)) {
                    console.error('Error. Please choose from available moves!')
                    return this.play()
                }
        }

        const result = this.moveRules.determineWinner(userMove - 1, this.computerMoveId)

        console.log(`Your move: ${moves[userMove - 1]}`)
        console.log('Computer\'s Move:', this.computerMove)
        console.log('Result:', result)
        console.log('HMAC key:', this.key)
        console.log('====================Finish====================')
    }
}

const moves = process.argv.slice(2)

if (moves.length < 3) {
    console.log('Error. Please enter at least 3 arguments!')
    process.exit(1)
}

if (moves.length % 2 !== 1) {
    console.log('Error. Please enter an odd number of arguments!')
    process.exit(1)
}

if (moves.length !== new Set(moves).size) {
    console.log('Error. Please enter unique arguments!')
    process.exit(1)
}

const game = new Game(moves)
game.start()
