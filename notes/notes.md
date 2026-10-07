
# Before starting the project
- Inspiration images
- Mood board
- Concept board (overall theme)
- Cahier des charges

# Cahier des charges
- Ask questions to define the scope and what the project actually is
- Understand the customer's demands
- Identify the inconsistencies and the contradictions or whatever is impossible.
- Decide for the client and take responsibility for those decisions

# deliverable
- cahier des charges de 3 a 5 pages
- A vision of the project explained in a few lines
- A section dedicated to specifying and defining terms used in the document
- Numbered criteria for the project
- The contradictions and blurry areas of the project definition
- Our questions to the client
- Our hypotheses
- Prioritize your criteria (The first things that should be done for this project)

# Rules
- Individual work but we are allowed to communicate
- AI is ok and recommended
- You may ask questions to the client but the questions must be asked in the #web-V channel on the school's Discord

# ***Everything above is explained in more details in the file provided by the teacher***
---

# ***Here's the meat of the subject***

# What is the project
- A typing application
- Type racer typeshit
- Aesthetically cool for young kids (high school)

# What he wants explicitely
- A website where students can compete against each other
- In real time position tracking for the racers
- A way to practice by themselves
- Target audience (Highschool kids 12 to 17 y/o)
- Must work kind of like kahoot with a code to join a room with a code
- During the race everyone types at the same time
- The race host can either watch the race or take part in it
- Students can be spectator on the host's approval
- To start a race the minimum ammount of racer is 2 but there is no maximum (eg: 100)
- Something to reward the students for getting faster (graph + unlockables)
- Players that loose connection to the room aren't kicked out of the race if the race isn't over and the connection is fixed
- Players can abandon a race and they will be considered loosers
- Host can configure a max amount of time to finish the race
- When the first player finishes a race start a timer to close the race
- The whole site must be bilingual
- The site must be available in light theme and dark theme
- The site must be responsive (works on phones and tablets not just computers)

# Nice to have (basically my ideas but approved by the customer)
- Instant death mode for a race
- Give them an time objective to reach
- A way to make teams for races
- Sound effects when passing someone

# Accounts
- Accounts can be created with Username + password (must be not recommended in the UI)
- Accounts can be created with Oauth via Discord or Github
- Don't need an account to participate in a race
- Page with statistics (average wpm, ammount of races, fastest wpm, etc)
- Settings page (can add another authentication technique)
- Forgetting password isn't too bad if the user used the weakest authentication method

# Race
- No copy/paste allowed in a race
- At the start of a race, there must be a countdown before it actually starts
- Each race can be configurable (Host only)
- While configuring the race the players can see the race's settings
- Everyone can create a race
- Every racer displays stats 
- After a race there's a stats page for the specific race
- Once everyone in the race is finished show the finish screen
- Once the timer is up for the race, show the finish screen
- If the option to let the player continue after a typo is selected, find a way to make them not loose
- If the race is empty we need bots
- Last players can get boosts
- If a player joins while the race is already started he automatically a spectator (for this race only)
- Host must be able to kick a racer from the race

# Race options
- Can choose from either a quote or random words
- random words can choose from a few different criteria (accents, punctuation)
- Can choose custom text
- Can choose language (that include programming languages)
- Can choose theme
- Can choose the difficulty of the race (special characters, accents
- Can choose the length of the race
- Can blacklist some characters
- Can prioritise some characters
- Can set a time limit for the race
- Each race must be generated using an algorithm so that each race is different
- Can choose if the player can continue after a typo or not

# When a race is finished
- A podium screen
- A stats screen
- Some graphs / some cool relevant info
- A Heatmap of the most missed keys
- One of two options
    1. start a new race with the same players
    2. Close this room

# Bot Settings (free to choose how the bots are implemented)
- Difficulty setting (speed + typo) (easy, medium, expert, impossible)
- The bots must appear human (speed must be variable)

# Boosts (ideas but at least 2 of those)
## (The key for this one is to give the impression that every player even the slowest ones can win from time to time (Mario kart vibe))
- first player gets a longer race
- last player gets a shorter race
- the first players that (50% of the lobby) are ahead of other in the lobby get a distraction to keep them from typing that fast


# How to join a race
- A Race can be public (Everyone can join that race. Account / no Account, Present or not)
- A race can semi-public (Everyone can join with a Room code or something similar)
- A race can be private (Only the people that are invited (use a single use link to invite players))
- On the home page, you can start a race straight from there (if no race available, make that user the host of that race)

# Aesthetic design
- Must be aesthetically unique
- Must not look AI generated
- Must not be AI slop (purely aesthetically)

# Name ***CANNOT BE AI GENERATED***
- learn to think by yourself loser

# Logo ***CANNOT BE AI GENERATED***
- make a real logo don't be a bitch

# ***Must be made with REACT, NEXT.JS, TAILWIND, POSTGRESQL***
# ***Must be accessible with https***
# ***Everything must be free if possible***
# ***Everything must be automatically tested*** (unit tests, modifications on main (github) must run tests and deploy automatically)
# ***Security must be top notch***
# ***Must be easy to keep the project going***

# Checkpoint 1
- hosted with https
- authentication
- start of artistic design


