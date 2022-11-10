# wordle

breakdown of files

- answers.txt
  - list of all valid wordle answers in alphabetical order

- guesses.txt
  - list of all valid wordle guesses (that are not in answers.txt) in alphabetical order

- solver.py
  - a solver for wordle
  - first guess is entered by the user (case insensitive)
  - results of each guess are entered by the user (case insensitive)
    - 'G' : green square (right place)
    - 'O' : orange square (not right place but in word)
    - '-' : black square (not in word)
    - e.g. 'ggggg', 'og--o', '----g'
  - successive guesses are determined by the solver to minimise the average number of words left

any comments, feedback or improvements on code, programming practices, algorithm choices etc. is more than welcomed and very much appreciated :)
