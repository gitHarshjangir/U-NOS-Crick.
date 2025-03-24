/**
 * Simple Cricket Match Simulation Engine
 * This class handles cricket match simulation without requiring external APIs
 */
class SimpleSimulationEngine {
    constructor() {
        console.log('Initializing Simple Cricket Match Simulation Engine');
        this.processingStartTime = null;
        
        // Read simulation settings
        this.updateSettings();
    }
    
    /**
     * Update settings from localStorage
     */
    updateSettings() {
        this.realisticMode = localStorage.getItem('realisticMode') === 'true';
        this.allowTies = localStorage.getItem('allowTies') === 'true';
        console.log(`Simulation settings: realistic mode = ${this.realisticMode}, allow ties = ${this.allowTies}`);
    }
    
    /**
     * Process a match using the local simulation algorithm
     * @param {Object} matchData - The input match data to process
     * @returns {Promise<Object>} - The processed match data
     */
    async processMatch(matchData) {
        console.log('Processing match with local simulation algorithm', matchData);
        this.processingStartTime = Date.now();
        
        // Always update settings before processing
        this.updateSettings();
        
        try {
            // Use the existing fallback generator for now
            // This will be replaced with the user's own algorithm
            const simulatedData = window.generateFallbackData ? 
                window.generateFallbackData(matchData) : 
                this.generateSimpleMatchData(matchData);
            
            // Add a minimum processing time to ensure UI feedback
            await this.ensureMinimumProcessingTime();
            
            // Mark as processed by local simulation
            simulatedData._apiProcessed = false;
            simulatedData._processing = false;
            simulatedData._generatedBy = this.realisticMode ? 'Realistic Simulation' : 'Basic Simulation';
            simulatedData._settings = {
                realisticMode: this.realisticMode,
                allowTies: this.allowTies
            };
            
            return simulatedData;
        } catch (error) {
            console.error('Error in match simulation:', error);
            await this.ensureMinimumProcessingTime();
            throw error;
        }
    }
    
    /**
     * Generate simple match data
     * This is a placeholder function until the user implements their own algorithm
     */
    generateSimpleMatchData(matchData) {
        console.log('Generating simple match data with settings:', 
            { realisticMode: this.realisticMode, allowTies: this.allowTies });
        
        const format = matchData.format || 'T20';
        const team1 = matchData.player1Name || 'Team 1';
        const team2 = matchData.player2Name || 'Team 2';
        const venue = matchData.stadium || 'Local Stadium';
        
        // Extract player names if provided
        const team1Players = Array.isArray(matchData.team1Players) && matchData.team1Players.length > 0
            ? matchData.team1Players.map(p => typeof p === 'object' ? p.name : p)
            : this.generateDefaultPlayerNames(team1, 11);
        
        const team2Players = Array.isArray(matchData.team2Players) && matchData.team2Players.length > 0
            ? matchData.team2Players.map(p => typeof p === 'object' ? p.name : p)
            : this.generateDefaultPlayerNames(team2, 11);
        
        // Generate random scores based on format
        const maxOvers = format === 'T20' ? 20 : (format === 'ODI' ? 50 : 90);
        const maxRuns = format === 'T20' ? 220 : (format === 'ODI' ? 350 : 500);
        
        // More realistic scoring if realistic mode is enabled
        const minRuns = this.realisticMode ? 
            (format === 'T20' ? 120 : (format === 'ODI' ? 200 : 250)) : 0;
        
        // Calculate more realistic overs based on format
        const getRealisticOvers = () => {
            if (format === 'T20') {
                return (18 + Math.random() * 2).toFixed(1); // Between 18 and 20 overs
            } else if (format === 'ODI') {
                return (45 + Math.random() * 5).toFixed(1); // Between 45 and 50 overs
            } else {
                return (80 + Math.random() * 10).toFixed(1); // Between 80 and 90 overs
            }
        };
        
        // Determine if this will be a tied match
        const isTied = this.allowTies && Math.random() < 0.1; // 10% chance of a tie if allowed
        
        // Generate scores
        let team1Score, team2Score;
        
        if (isTied) {
            // For tied matches, both teams have the same score
            team1Score = minRuns + Math.floor(Math.random() * (maxRuns - minRuns));
            team2Score = team1Score;
        } else {
            // Normal score generation
            team1Score = minRuns + Math.floor(Math.random() * (maxRuns - minRuns));
            team2Score = minRuns + Math.floor(Math.random() * (maxRuns - minRuns));
        }
        
        // Determine overs based on settings
        const team1Overs = this.realisticMode ? getRealisticOvers() : (Math.random() * maxOvers).toFixed(1);
        const team2Overs = this.realisticMode ? getRealisticOvers() : (Math.random() * maxOvers).toFixed(1);
        
        // Determine wickets (more realistic in realistic mode)
        const getWickets = (score) => {
            if (this.realisticMode) {
                // More wickets for lower scores, fewer for higher scores
                const wicketChance = 1 - (score / maxRuns);
                return Math.min(10, Math.floor(wicketChance * 15));
            } else {
                return Math.floor(Math.random() * 10);
            }
        };
        
        const team1Wickets = getWickets(team1Score);
        const team2Wickets = getWickets(team2Score);
        
        // Generate basic batting stats
        const generateBattingStats = (players, teamScore, wicketsFallen) => {
            const battingStats = [];
            let runsAssigned = 0;
            
            // Assign runs to top batsmen (not all players will bat)
            const batsmen = Math.min(wicketsFallen + 2, players.length);
            
            for (let i = 0; i < batsmen; i++) {
                // Last batsmen have 0 runs (not out)
                let runs = 0, balls = 0, fours = 0, sixes = 0;
                
                if (i < wicketsFallen) {
                    // Distribute runs - top order gets more runs
                    const importance = (batsmen - i) / batsmen; // Higher for top order
                    runs = Math.floor((teamScore / batsmen) * importance * (0.7 + Math.random() * 0.6));
                    
                    // Ensure we don't assign more runs than the total
                    if (runsAssigned + runs > teamScore) {
                        runs = Math.max(0, teamScore - runsAssigned);
                    }
                    
                    runsAssigned += runs;
                    
                    // Calculate balls, fours, sixes
                    balls = Math.max(1, Math.floor(runs * (1 + Math.random() * 0.5)));
                    fours = Math.floor(runs / 15);
                    sixes = Math.floor(runs / 30);
                }
                
                battingStats.push({
                    name: players[i],
                    runs: runs,
                    balls: balls,
                    fours: fours,
                    sixes: sixes,
                    strikeRate: balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00",
                    dismissal: i < wicketsFallen ? ['caught', 'bowled', 'lbw', 'run out', 'stumped'][Math.floor(Math.random() * 5)] : 'not out'
                });
            }
            
            // Add extras to make up total if needed
            const extras = teamScore - runsAssigned;
            
            return { battingStats, extras };
        };
        
        // Generate basic bowling stats
        const generateBowlingStats = (players, opposingRuns, opposingWickets, opposingOvers) => {
            const bowlers = Math.min(5, players.length);
            const bowlingStats = [];
            
            // Use players from middle to end of the list as bowlers
            const bowlerIndices = players.length <= 5 
                ? [...Array(players.length).keys()] 
                : [...Array(bowlers).keys()].map(i => players.length - bowlers + i);
            
            let wicketsAssigned = 0;
            let runsAssigned = 0;
            let oversAssigned = 0;
            
            const totalOvers = parseFloat(opposingOvers);
            
            for (let i = 0; i < bowlers; i++) {
                const playerIndex = bowlerIndices[i];
                
                // Distribute overs among bowlers
                let overs = (totalOvers / bowlers) * (0.8 + Math.random() * 0.4);
                
                // Ensure we don't assign more overs than the total
                if (oversAssigned + overs > totalOvers) {
                    overs = Math.max(0, totalOvers - oversAssigned);
                }
                
                oversAssigned += overs;
                
                // Wickets and runs
                let wickets = Math.floor(opposingWickets / bowlers * (0.5 + Math.random() * 1.0));
                
                if (wicketsAssigned + wickets > opposingWickets) {
                    wickets = Math.max(0, opposingWickets - wicketsAssigned);
                }
                
                wicketsAssigned += wickets;
                
                let runs = Math.floor((opposingRuns / totalOvers) * overs * (0.8 + Math.random() * 0.4));
                
                if (runsAssigned + runs > opposingRuns) {
                    runs = Math.max(0, opposingRuns - runsAssigned);
                }
                
                runsAssigned += runs;
                
                const maidens = Math.floor(Math.random() * (overs / 4));
                
                bowlingStats.push({
                    name: players[playerIndex],
                    overs: overs.toFixed(1),
                    maidens: maidens,
                    runs: runs,
                    wickets: wickets,
                    economy: overs > 0 ? (runs / overs).toFixed(2) : "0.00"
                });
            }
            
            return bowlingStats;
        };
        
        // Generate batting and bowling stats
        const team1BattingStats = generateBattingStats(team1Players, team1Score, team1Wickets);
        const team2BattingStats = generateBattingStats(team2Players, team2Score, team2Wickets);
        
        const team1BowlingStats = generateBowlingStats(team1Players, team2Score, team2Wickets, team2Overs);
        const team2BowlingStats = generateBowlingStats(team2Players, team1Score, team1Wickets, team1Overs);
        
        // Determine winner and margin
        let winner, margin, method;
        
        if (isTied) {
            winner = 'Match Tied';
            margin = 'Scores level';
            method = 'Standard';
        } else if (team1Score > team2Score) {
            winner = team1;
            margin = `${team1Score - team2Score} runs`;
            method = 'Standard';
        } else {
            winner = team2;
            margin = `${10 - team2Wickets} wickets`;
            method = 'Standard';
        }
        
        // Find top performers
        const getTopPerformer = (statsArray, metric) => {
            return statsArray.reduce((prev, current) => 
                (prev[metric] > current[metric]) ? prev : current, { [metric]: 0 });
        };
        
        const team1TopBatsman = getTopPerformer(team1BattingStats.battingStats, 'runs');
        const team2TopBatsman = getTopPerformer(team2BattingStats.battingStats, 'runs');
        
        const team1TopBowler = getTopPerformer(team1BowlingStats, 'wickets');
        const team2TopBowler = getTopPerformer(team2BowlingStats, 'wickets');
        
        // Determine player of the match
        const playerOfMatch = team1TopBatsman.runs > team2TopBatsman.runs 
            ? team1TopBatsman 
            : team2TopBatsman;
        
        // Return enhanced match data
        return {
            format: format,
            venue: venue,
            date: new Date().toLocaleDateString(),
            team1: {
                name: team1,
                score: { runs: team1Score, wickets: team1Wickets },
                overs: team1Overs,
                battingStats: team1BattingStats.battingStats,
                bowlingStats: team1BowlingStats,
                extras: team1BattingStats.extras
            },
            team2: {
                name: team2,
                score: { runs: team2Score, wickets: team2Wickets },
                overs: team2Overs,
                battingStats: team2BattingStats.battingStats,
                bowlingStats: team2BowlingStats,
                extras: team2BattingStats.extras
            },
            result: {
                winner: winner,
                margin: margin,
                method: method
            },
            playerOfMatch: {
                name: playerOfMatch.name,
                team: team1Players.includes(playerOfMatch.name) ? team1 : team2,
                performance: `${playerOfMatch.runs} runs (${playerOfMatch.balls} balls)`
            },
            keyPerformers: {
                batting: [
                    { name: team1TopBatsman.name, team: team1, performance: `${team1TopBatsman.runs} runs (${team1TopBatsman.balls} balls)` },
                    { name: team2TopBatsman.name, team: team2, performance: `${team2TopBatsman.runs} runs (${team2TopBatsman.balls} balls)` }
                ],
                bowling: [
                    { name: team1TopBowler.name, team: team1, performance: `${team1TopBowler.wickets} wickets for ${team1TopBowler.runs} runs` },
                    { name: team2TopBowler.name, team: team2, performance: `${team2TopBowler.wickets} wickets for ${team2TopBowler.runs} runs` }
                ]
            },
            toss: {
                winner: Math.random() > 0.5 ? team1 : team2,
                decision: Math.random() > 0.5 ? 'bat' : 'bowl'
            },
            _generatedBy: this.realisticMode ? 'Realistic Simulation' : 'Basic Simulation',
            _apiProcessed: false,
            _processing: false
        };
    }
    
    /**
     * Generate default player names for a team
     */
    generateDefaultPlayerNames(teamName, count) {
        const playerNames = [];
        
        // Common cricket player positions/roles
        const positions = [
            'Captain', 'Opener', 'Batsman', 'All-rounder', 
            'Wicket-keeper', 'Bowler', 'Spinner', 'Fast Bowler'
        ];
        
        for (let i = 1; i <= count; i++) {
            let position = '';
            if (i === 1) position = 'Captain';
            else if (i === 5) position = 'Wicket-keeper';
            else if (i <= 4) position = 'Batsman';
            else if (i <= 7) position = 'All-rounder';
            else position = 'Bowler';
            
            playerNames.push(`${teamName} ${position} ${i}`);
        }
        
        return playerNames;
    }
    
    /**
     * Ensure a minimum processing time has elapsed for better UX
     */
    async ensureMinimumProcessingTime() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - this.processingStartTime;
        const minProcessingTime = 2000; // 2 seconds for minimal feedback
        
        if (elapsedTime < minProcessingTime) {
            const remainingTime = minProcessingTime - elapsedTime;
            console.log(`Adding short delay of ${remainingTime}ms for UI feedback`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
    }
} 