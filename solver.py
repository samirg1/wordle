#!/usr/bin/env python3
# 
#   solver.py 
#   Samir Gupta
#   05/03/2022
#
from guesses import guesses
from answers import answers
from time import time
from random import shuffle
both = guesses + answers

class Game:
    def __init__(self, first_guess, bot=False, n=1):
        # initialising with bot=True, makes the computer solve n words
        # initialising with bot=False, is user mode, where the user inputs the outcomes
        self.guess = first_guess
        self.bot = bot
        self.answers = answers
        self.n = 1
        self.outcomes = total_outcomes()
        if self.bot:
            self.time = time()
            self.rand_ans = [a for a in answers]
            shuffle(self.rand_ans)
            self.rand_n = 0
            self.errors = 0
            self.attempts = 0
            self.words = 0
            self.total = n
            self.rand_word()


    def rand_word(self):
        # getting a random word in answers
        self.word = self.rand_ans[self.rand_n]
        self.rand_n += 1
        if self.rand_n == len(self.rand_ans):
            self.rand_n = 0
            shuffle(self.rand_ans)
        print(f'\n{self.word.upper()} - {self.words+1}/{self.total}')
    

    def check(self, guess):
            # checking a guess against the word, returns the outcome of the guess

            # default outcome
            outcome = ['-', '-', '-', '-', '-']

            # keeping track of the letters that have been checked (for doubles)
            letters = {}

            # get g's and add to letters
            for x in range(len(guess)):
                if guess[x] == self.word[x]:
                    outcome[x] = 'g'
                    try: 
                        letters[guess[x]] += 1
                    except:
                        letters[guess[x]] = 1
            
            # getting o's if there are any while taking into consideration doubles
            for x in range(len(guess)):
                count = self.word.count(guess[x])
                if count and outcome[x] != 'g':
                    try:
                        if letters[guess[x]] < count:
                            outcome[x] = 'o'
                            letters[guess[x]] += 1
                    except:
                        outcome[x] = 'o'
                        letters[guess[x]] = 1
            return outcome


    def solve_word(self):
        # function used to solve for a word

        # guess is printed (extra space is to make sure it clears the line when printed)
        print(f'GUESS : {self.guess.upper()}              ')
        self.n += 1

        # result of guess is obtained
        if self.bot:
            self.res = self.check(self.guess)
            print('RESULT : ' + ''.join(self.res))
        else:
            self.res = list(input(f"RESULT : "))
            while not outcome_check(self.res):
                print(f'GUESS : {self.guess.upper()}              ')
                self.res = list(input(f"RESULT : "))

        # answers are refined to meet result
        self.new_ans = list(filter(lambda an: is_possible(an, self.guess, self.res), self.answers))

        # if guess was correct (without refining answers down to one) reduce the amount of guesses and dont print answers left
        if self.res == ['g', 'g', 'g', 'g', 'g']:
                self.n -= 1
        else:
            print(f'ANSWERS LEFT : {len(self.new_ans)}')
        
        # if one answer is left, game is won, if none are left, there was an error
        if len(self.new_ans) in (0, 1):
            self.word_complete(bool(len(self.new_ans)))
            return 
    
        # using next_guess.txt to find the second guess after trace
        if self.guess == 'trace':
            with open('next_guess.txt', 'r') as f:

                # go through each line in the file
                for line in f.readlines():

                    # get the outcome from the line
                    split = line[:-1].split(' - ')
                    o_check = [split[0][i] for i in range(len(split[0])) if split[0][i] in ('g', 'o', '-')]

                    # if the outcome from the line is the one got when 'trace' was used, bypass solving for the second guess and go straight to the third
                    if o_check == self.res:
                        self.answers = self.new_ans
                        self.guess = split[1]
                        self.solve_word()
                        return 
        
        # hold a temporary best
        best = ('', len(self.new_ans))

        # check each guess
        for g in range(len(both)):
            total = len(self.outcomes)
            possible_ans = 0
            for o in self.outcomes: # check each outcome

                # refine the answers to get the amount of words left
                ans_left = len(list(filter(lambda a: is_possible(a, both[g], o), self.new_ans)))
                if not ans_left:
                    total -= 1
                possible_ans += ans_left
            
            # the temporary best is compared to the current guess
            best = min(best, (both[g], possible_ans/total), key=lambda x: x[1])

            print(f'Checking {g+1}/{len(both)}', end='\r')

        # next guess is determined and solving continues
        self.answers = self.new_ans
        self.guess = best[0]
        self.solve_word()


    def word_complete(self, success):
        # to be run when a word is either solved or an error occured

        # print output to user and update variables
        if success:
            print(f'** WORD = {self.new_ans[0].upper()} - {self.n} Guesses **')
            if self.bot:
                self.attempts += self.n
            else:
                return
        elif not success and self.bot:
            print(f'ERROR OCCURED')
            self.errors += 1
        else:
            # if error occurs, print all possible answers before error occured (user mode)
            print(f'Error Occured, answer is one of : {self.answers}')
            return

        # end word guessing if total is reached, print summary (bot only)
        self.words += 1
        if self.words == self.total:
            print(f'\nCompleted {self.total} Words\nAverage Guesses: {round(self.attempts/(self.total-self.errors), 2)}\nErrors: {self.errors}\nTime : {round((time()-self.time)/60, 2)} mins')
            return
        
        # reinitialise variables, get a new word and solve it (bot only)
        self.n = 1
        self.answers = answers
        self.guess = 'trace'
        self.rand_word()
        self.solve_word()


def outcome_check(outcome):
    # determine if outcome is viable
    for char in outcome:
        if char not in ('-', 'o', 'g'):
            print("ERROR : input can only contain '-', 'o' or 'g'")
            return False

    if len(outcome) != 5:
        print("ERROR : input has to be 5 characters long")
        return False
    
    return True


def total_outcomes(n=5, part=[]):
    # function to get all possible outcomes
    if len(part) == n:
        return [part]
    else:
        res = []
        for o in ['-', 'o', 'g']:
            res += total_outcomes(n, part + [o])
        return res


def is_possible(word, guess, outcome):
    # determines whether a word is viable to be an answer, given an attempt and the outcome the attempt provided

    # split the indexes into groups [[g's], [o's], [-'s]] as checking requires g's to be checked first, o's second and -'s last
    order = [[],[],[]]
    for i in range(len(outcome)):
        if outcome[i] == 'g':
            order[0].append(i)
        elif outcome[i] == 'o':
            order[1].append(i)
        else:
            order[2].append(i)

    # keeping tracking of letters that have been checked (for doubles)
    checked = {}
    for group in order:
        for x in group: 
            # go through the g's in outcome first, then the o's, then the -'s

            count = word.count(guess[x])

            # if the outcome is g, check if word contains guess[x] at position x
            # add to checked
            if outcome[x] == 'g':
                if word[x] != guess[x]:
                    return False
                try:
                    checked[guess[x]] += 1
                except:
                    checked[guess[x]] = 1

            # if outcome is o, if checked[guess[x]] exists, it must be less than count and guess[x] cannot equal word[x] in order for the word to be viable
            # if checked[guess[x]] doesnt exist, there must be a count and guess[x] cannot equal word[x] for the word to be viable
            elif outcome[x] == 'o':
                try:
                    if checked[guess[x]] == count or guess[x] == word[x]:
                        return False
                    checked[guess[x]] += 1
                except:
                    if not count or guess[x] == word[x]:
                        return False
                    checked[guess[x]] = 1

            # if the outcome is -, if checked[guess[x]] exists and there is a count, checked[guess[x]] must already be equal to count for the word to be viable
            # if checked[guess[x]] doesnt exist but there is a count the word cannot be viable
            elif outcome[x] == '-':
                if count:
                    try:
                        if checked[guess[x]] < count:
                            return False
                    except:
                        return False
    return True


def get_first_guess():
    # code used to produce first_guess.txt and find that 'trace' was the best first word
    outcomes = total_outcomes()
    word_set = []
    for g in range(len(both)):
        total = len(outcomes)
        possible_ans = 0
        for o in outcomes: # check all outcomes

            # see how many answers are left are both[g] is guessed
            ans_left = len(list(filter(lambda a: is_possible(a, both[g], o), answers)))
            
            # if 0 answers are left, outcome is impossible therefore excluded from total
            if not ans_left:
                total -= 1
            possible_ans += ans_left

        # get average, print for reference and append to word_set
        av = possible_ans/total
        print(f'{g+1} - {both[g]} - {av}') 
        word_set.append((both[g], av))

    # create file to write the sorted word_set in
    with open('first_guess.txt', 'w') as f:
        for x in sorted(word_set, key=lambda w: w[1]):
            f.write(f'{x[0]} - {x[1]}\n')


def get_next_word():
    # finding the next guess after 'trace' by working out the best possible word depending on the 243 outcomes
    first_guess = 'trace'
    outcomes = total_outcomes()
    for o1 in reversed(outcomes):
        print(o1)
        ans_mid = list(filter(lambda a: is_possible(a, first_guess, o1), answers))
        best = ('', len(ans_mid))
        for w in range(len(both)):
            total = len(outcomes)
            possible_ans = 0
            for o2 in outcomes: # check all outcomes
                ans_left = len(list(filter(lambda a: is_possible(a, both[w], o2), ans_mid)))
            
                if not ans_left:
                    total -= 1
                possible_ans += ans_left

            if total != 0:
                best = min(best, (both[w], possible_ans/total), key=lambda x: x[1])

            print(f'{w+1}/{len(both)}', end='\r')

        # print to text file
        with open('next_guess.txt', 'a') as f:
            f.write(f'{o1} - {best[0]}\n')


if __name__ == '__main__':
    MODE = input('MODE: ').upper()
    while MODE not in ('USER', 'BOT'):
        print('MODE INVALID : Must be either USER or BOT')
        MODE = input('MODE: ').upper()
    
    if MODE == 'BOT':
        n = input("WORDS: ")        
        while 1:
            try:
                n = int(n)
                if n > 0 and n <= 200: # 200 is set as a limit to prevent exceeding recursion depth
                    break
            except:
                pass
            
            print('WORDS INVALID : Must be an integer n where 1 <= n <= 200')
            n = input("WORDS: ")

        wordle = Game('trace', True, n)
        wordle.solve_word()
    else:
        wordle = Game('trace')
        wordle.solve_word()