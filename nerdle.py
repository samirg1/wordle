#   Nerdle.py
#   Date: 20/05/2022
#   Author: Samir Gupta 
#   Purpose: To determine how many pairs of mutually exclusive valid Nerdle equations there are (if any)
#   Inspiration: Nerdle: https://nerdlegame.com : there are 15 options (must have '=') and 8 spots each guess, so there must be a way to use all 15 options in two guesses.

BOOLEAN_IS_EQUALS: str = '=='
EQUALS_SIGN: str = '='

# A class representing the game Nerdle
class Nerdle:

    # The length of a complete equation
    LENGTH_OF_EQUATION: int = 8

    # Maximum length of integers
    MAX_INTEGER_LENGTH: int = 3

    # The possible numbers that could make up the equation
    NUMBERS: list = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

    # The possible mathematical symbols that could make up the equation
    SYMBOLS: list = ['+', '-', '*', '/']

    # The equals sign used in the equation
    EQUALS: list = [EQUALS_SIGN]

    # The indices of the potential places for a symbol
    SYMBOL_INDICES: list = [1, 2, 3, 4]

    # The indices of the potential places for an equals sign
    EQUALS_INDICES: list = [4, 5, 6]

    # Get the possible characters given a partial equation, ensuring no duplicate character are selected
    # param
    # - part: the unfinished equation
    # return: a list of possible characters
    def getPossibleCharacters(self, part: str) -> list:
        i = len(part)
        total = list(self.NUMBERS)
        if i >= self.MAX_INTEGER_LENGTH: # can't have an integer longer than the max length
            count = 0
            for j in range(self.MAX_INTEGER_LENGTH):
                if part[i-(j+1)] in self.NUMBERS:
                    count += 1
            if count == self.MAX_INTEGER_LENGTH:
                total = []

        if i == 0 or part[i-1] not in self.SYMBOLS: # can't have a symbol or equal sign following a different symbol
            if i in self.SYMBOL_INDICES:
                total += self.SYMBOLS
            if i in self.EQUALS_INDICES:
                total += self.EQUALS

        for c in part: # remove any duplicates from the unfinished equation
            if c in total:
                total.remove(c)

        return total

    # Determine whether a possible complete solution is viable
    # param
    # - possible: the possible equation
    # return: boolean indicating whether the possible equation is equatable (i.e True)
    # throws: ValueError if length of possible solution is incorrect, or if eval fails (possible solution is not valid)
    def isPossibleEquation(self, possible: str) -> bool:
        if len(possible) != self.LENGTH_OF_EQUATION:
            raise ValueError(f"Invalid possible equation length, length should be: {self.LENGTH_OF_EQUATION}, got '{possible}' -> {len(possible)}")

        if EQUALS_SIGN not in possible: # equation must have an equals sign
            return False

        equation = ''
        for i in range(len(possible)): # ignore the leading 0 of an integer ('01' -> '1')
            if possible[i] == '0' and (i != len(possible)-1) and (possible[i-1] in self.SYMBOLS + self.EQUALS or i == 0) and (possible[i+1] in self.NUMBERS):
                equation += ''
            else:
                equation += possible[i]

        try:
            return eval(BOOLEAN_IS_EQUALS.join(equation.split(EQUALS_SIGN))) # attempt to evaluate the solution and return if it is correct
        except ZeroDivisionError:
            return False
        except SyntaxError as err:
            raise ValueError(f"Invalid possible equation: {err.msg} -> column {err.offset} of '{possible}'")

    # Find all valid Nerdle equations
    # param
    # - part: optional string used for keeping track of partial equation during recursion
    # return: list of valid equations
    def find_valid_equations(self, part: str = '') -> list:
        if len(part) == self.LENGTH_OF_EQUATION:
            if self.isPossibleEquation(part):
                print(part)
                return [part] 
            else:
                return []
        else:
            res = []
            for o in self.getPossibleCharacters(part):
                res += self.find_valid_equations(part + o)
            return res


# Find and return a list of pairs of strings that are mutually exclusive (share no common character)
# param
# - allStrings: a list of strings to check
# return: a list of all possible pairs of allStrings that are mutually exclusive
def findMutuallyExclusiveStrings(allStrings: list) -> list:
    pairs = []
    for i in range(len(allStrings)):
        word1 = allStrings[i]
        for j in range(i, len(allStrings)):
            word2 = allStrings[j]
            if mutuallyExclusive(word1, word2):
                pairs.append((word1, word2))
    return pairs

# Determine if two strings are mutually exclusive or not (share no common character) ** except the equals sign for the Nerdle case
# param
# - s1: the first string to check
# - s2: the second string to check
# return: True if mutually exclusive, False if not
def mutuallyExclusive(s1: str, s2: str) -> bool:
    dic = dict([(c, True) for c in s1])
    for c in s2:
        try:
            if dic[c] and c != EQUALS_SIGN: # both strings must have an equals sign
                return False
        except KeyError:
            continue
    return True


if __name__ == "__main__":
    nerdle = Nerdle()
    pairs = findMutuallyExclusiveStrings(nerdle.find_valid_equations())
    print(pairs)
    print(len(pairs))

# Stats found
#
# 2,562,890,625 possible guesses
#   259,459,200 possible non-repeating guesses (10.12% 1/10)
#     5,685,120 possible valid non-repeating guesses (0.22% 1/450)
#         9,155 possible valid, computable and non-repeating guesses (0.00036% 1/30,000)
#
#
# 6,568,408,356,000,000,000 possible guess pairs
#    67,319,078,460,000,000 possible non-repeating guess pairs (1.03% 1/100)
#        32,320,589,414,400 possible valid and non-repeating guess pairs (0.00049% 1/20,000)
#                83,814,025 possible valid, computable and non-repeating guess pairs (0.00000000127% 1/7,000,000)
#                    10,232 possible valid, computable, non-repeating and non-overlapping guess pairs (0.00000000000016% 1/640,000,000,000,000)