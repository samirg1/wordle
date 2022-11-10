/**
 * Solver for Wordle
 * @author Samir Gupta
 * @date 2022-09-11
 * @note This implementation was originally translated from Python
 */

#include <stdio.h>
#include <stdbool.h>
#include <string.h>

#define ANSWERS_FILE "answers.txt" // answers file name
#define GUESSES_FILE "guesses.txt" // guesses file name
#define ANSWER_LENGTH 2315         // the amount of valid answers wordle has
#define GUESSES_LENGTH 12972       // the amount of valid guesses wordle allows

#define WORD_SIZE 6      // the total word size of each word (5 + escaping)
#define ALPHABET_SIZE 26 // the total size of the alphabet the words derive from

#define TOTAL_OUTCOMES 243 // the total number of outcomes possible in wordle
#define OUTCOMES_LENGTH 3  // the total number of options for each letter in an outcome
#define GREEN_INPUT 'g'    // the green input character
#define ORANGE_INPUT 'o'   // the orange input character
#define BLACK_INPUT '-'    // the black input character
#define GREEN 2            // the green integer used in replacement of the green character
#define ORANGE 1           // the orange integer used in replacement of the orange character
#define BLACK 0            // the black integer used in replacement of the black character

#define NULL_INDEX -1 // index used to identify when we've hit the end of an integer array

/**
 * Counts the number of a particular character in a string.
 * @param string The string to look in.
 * @param character The character to look for.
 * @return The number of this character in the string.
 */
int count_chr(char *string, char character)
{
    int count = 0;
    for (int i = 0; i < WORD_SIZE; i++)
    {
        if (string[i] == character)
            count++;
    }
    return count;
}

/**
 * Converts a character into it's lowercase equivalent.
 * @param character The character to convert.
 * @return The converted character.
 */
char to_lower(char character)
{
    if (character >= 'A' && character <= 'Z')
    {
        return character + 'a' - 'A';
    }
    return character;
}

/**
 * Get the first guess from the user's input.
 * @param guesses The valid guesses the user can choose from.
 * @return The user's first guess.
 */
char *get_first_guess(char guesses[][WORD_SIZE])
{
    static char first_guess[WORD_SIZE];
    printf("\n");
    while (1)
    {
        printf(" GUESS: ");

        for (int i = 0; i < WORD_SIZE - 1; i++) // get five characters
        {
            char c = to_lower(getchar());
            if (c == '\n') // skip end line character
            {
                i--;
                continue;
            }
            first_guess[i] = c;
        }
        first_guess[WORD_SIZE - 1] = '\0';

        for (int i = 0; i < GUESSES_LENGTH; i++)
        {
            if (strcmp(guesses[i], first_guess) == 0) // if we find the input in guesses return it
                return first_guess;
        }

        printf("** invalid first guess **\n"); // if we haven't found the input in guesses, print error message and retry
    }
}

/**
 * Get the result from the last guess from the user's input.
 * @return Pointer to the result array.
 */
int *get_result()
{
    static int result[WORD_SIZE - 1];
    while (1)
    {
        printf("RESULT: ");
        int error_detected = 0; // to detect when an invalid character is found
        for (int i = 0; i < WORD_SIZE - 1; i++)
        {
            char c = to_lower(getchar());
            if (c == '\n') // skip end line character
            {
                i--;
                continue;
            }

            if (c == GREEN_INPUT)
                result[i] = GREEN;
            else if (c == ORANGE_INPUT)
                result[i] = ORANGE;
            else if (c == BLACK_INPUT)
                result[i] = BLACK;
            else
                error_detected = 1; // invalid character was found
        }
        if (error_detected == 0)
            return result;                // if input was valid, return the result
        printf("** invalid result **\n"); // otherwise print error message and retry
    }
}

/**
 * Get the valid answers and valid guesses from their respective files.
 * @param answers The array to store the valid answers.
 * @param guesses The array to store the valid guesses.
 */
void get_answers_guesses(char answers[][WORD_SIZE], char guesses[][WORD_SIZE])
{
    FILE *f = fopen(ANSWERS_FILE, "r");
    for (int i = 0; i < ANSWER_LENGTH; i++)
    {
        char other[WORD_SIZE]; // use to store empty new line string
        fgets(answers[i], WORD_SIZE, f);
        strcpy(guesses[i], answers[i]);
        fgets(other, WORD_SIZE, f);
    }
    fclose(f);

    f = fopen(GUESSES_FILE, "r");
    for (int i = 0; i < GUESSES_LENGTH; i++)
    {
        char other[WORD_SIZE]; // use to store empty new line string
        fgets(guesses[i + ANSWER_LENGTH], WORD_SIZE, f);
        fgets(other, WORD_SIZE, f);
    }
    fclose(f);
}

/**
 * Get all possible outcomes of any given word.
 * @param outcomes The array to store all possible outcomes.
 */
void get_all_possible_outcomes(int outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1])
{
    for (int i = 0; i < TOTAL_OUTCOMES; i++)
    {
        int num = i;
        for (int j = 0; j < WORD_SIZE - 1; j++) // get the ternary representation of i for outcomes[i]
        {
            outcomes[i][WORD_SIZE - 1 - j - 1] = num % OUTCOMES_LENGTH;
            num /= OUTCOMES_LENGTH;
        }
    }
}

/**
 * Check if an answer is possible, given a guess and its outcome.
 * @param answer The answer to check.
 * @param guess The guess.
 * @param outcome The outcome.
 * @return Boolean indicating whether the answer is possible.
 */
bool is_possible(char answer[WORD_SIZE], char guess[WORD_SIZE], int outcome[WORD_SIZE - 1])
{
    int order[OUTCOMES_LENGTH][WORD_SIZE]; // compartmentalise the outcomes
    int a = 0, b = 0, c = 0;
    for (int i = 0; i < WORD_SIZE - 1; i++)
    {
        if (outcome[i] == GREEN)
            order[0][a++] = i; // green at index 0
        else if (outcome[i] == ORANGE)
            order[1][b++] = i; // orange at index 1
        else
            order[2][c++] = i; // blacks at index 2
    }
    // add a null index to each array to indicate where to stop
    order[0][a] = NULL_INDEX;
    order[1][b] = NULL_INDEX;
    order[2][c] = NULL_INDEX;

    int checked[ALPHABET_SIZE] = {}; // store the characters that have been checked

    for (int i = 0; i < OUTCOMES_LENGTH; i++)
    {
        int j = 0;
        while (order[i][j] != NULL_INDEX)
        {
            int index = order[i][j];
            int count = count_chr(answer, guess[index]);
            int checked_index = guess[index] - 'a' + 1; // index for the checked array

            // if the outcome is green, check if answer contains guess[index] at position index and add to checked
            if (outcome[index] == GREEN)
            {
                if (answer[index] != guess[index]) // answer must contain the letter at the index
                    return false;

                checked[checked_index]++;
            }

            // if outcome is orange, two scenarios are possible
            // - the letter hasn't been checked yet, therefore if the answer contains this letter or has the letter at index it is invalid
            // - the letter has been checked, therefore if we already checked the amount of the letter or the answer contains this letter at index it is invalid
            else if (outcome[index] == ORANGE)
            {
                if (checked[checked_index] == 0) // no greens of this letter have been checked yet for the letter in question
                {
                    if (count == 0 || guess[index] == answer[index]) // answer must contain the letter, not at the same index
                        return false;
                }

                else // some greens of this letter have been checked
                {
                    if (checked[checked_index] == count || guess[index] == answer[index])
                        return false; // answer must contain only count of the letter, and not at the same index
                }
                checked[checked_index]++;
            }

            // if outcome is black, three scenarios are possible
            // - there is no count of the letter in question, which means this answer is valid so far
            // - there is count of the letter and we haven't already checked this letter, meaning this answer is invalid
            // - there is count of the letter and we have checked the letter, and the number of checked is less than the count, meaning answer is invalid
            else
            {
                if (count != 0) // there is count of the letter
                {
                    if (checked[checked_index] == 0) // if no greens or oranges of this letter checked yet
                        return false;
                    else // greens or oranges of this letter have been checked
                    {
                        if (checked[checked_index] < count) // ensure we are not below the count of the letter
                        {
                            return false;
                        }
                    }
                }
            }
            j++;
        }
    }

    return true; // answer passes validation
}

/**
 * Find the next best guess.
 * @param guesses The array of all valid guesses.
 * @param answers The array of all valid answers.
 * @param outcomes The array of possible outcomes.
 * @param answer_indexes The array of indexes of the available answers in the current game state.
 * @return The guess that minimises the average amount of answers left.
 */
char *find_best_guess(char guesses[GUESSES_LENGTH][WORD_SIZE], char answers[ANSWER_LENGTH][WORD_SIZE], int outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1], int answer_indexes[ANSWER_LENGTH + 1])
{
    double min_average = ANSWER_LENGTH; // initialise minimum average
    static char min_word[WORD_SIZE];    // initialise minimum word

    for (int i = 0; i < GUESSES_LENGTH; i++) // for each guess
    {
        int total = TOTAL_OUTCOMES; // initialise total number of valid outcomes
        int possibles = 0;          // initialise number of possible answers

        for (int j = 0; j < TOTAL_OUTCOMES; j++) // for each outcome
        {
            int answers_left = 0; // initialise number of answers left for this outcome
            int k = 0;
            while (answer_indexes[k] != NULL_INDEX) // for each available answer check if it is possible with the current guess and outcome
            {
                if (is_possible(answers[answer_indexes[k]], guesses[i], outcomes[j]))
                    answers_left++; // if so add to number of answers left for this outcome
                k++;
            }

            if (answers_left == 0)     // if we have no answers left for this outcome
                total--;               // valid outcomes decreases
            possibles += answers_left; // add to total number of possible answers
        }

        double average_words_left = (double)possibles / total; // get the average number of answers left for this guess
        if (average_words_left == 1)
            return guesses[i]; // if average is 1, shortcut and return immediately (can't get better)

        if (average_words_left < min_average) // otherwise, update min_average, and min_word if out new average is smaller than min_average
        {
            strcpy(min_word, guesses[i]);
            min_average = average_words_left;
        }

        printf("Checking %d/%d\r", i + 1, GUESSES_LENGTH); // print current state of processing
        fflush(stdout);                                    // flush stdout for cleaner '\r' printing
    }

    return min_word; // return the best word found
}

/**
 * Filter the currently available answers to account for a new guess and result.
 * @param answers The array of all possible answers.
 * @param answer_indexes The indexes of the currently available answers for the current game state.
 * @param result The result of the new guess.
 * @param guess The new guess.
 * @return The total amount of viable answers left.
 */
int filter_answers(char answers[ANSWER_LENGTH][WORD_SIZE], int answer_indexes[ANSWER_LENGTH + 1], int result[WORD_SIZE - 1], char current_guess[WORD_SIZE])
{
    int new_indexes[ANSWER_LENGTH + 1]; // new indexes array
    int new_length = 0;
    int i = 0;

    while (answer_indexes[i] != NULL_INDEX) // loop through the currently available answers
    {
        int index = answer_indexes[i];
        if (is_possible(answers[index], current_guess, result)) // if the answer is still possible add to new indexes array
            new_indexes[new_length++] = index;
        i++;
    }
    new_indexes[new_length] = NULL_INDEX;

    int j = 0;
    while (new_indexes[j] != NULL_INDEX) // copy the new indexes array back into answer indexes
    {
        answer_indexes[j] = new_indexes[j];
        j++;
    }
    answer_indexes[j] = NULL_INDEX;

    return new_length; // return the total number of answers left
}

/**
 * Solve for a word.
 * @param total_guesses The total number of guesses so far.
 * @param current_guess The current guess for the word.
 * @param answers The array of all possible answers.
 * @param guesses The array of all possible guesses.
 * @param outcomes The array of all possible outcomes.
 * @param answer_indexes The array of indexes of all currently available answers in the game state.
 * @return The solution, or NULL if an error occurred.
 */
char *solve_word(int *total_guesses, char current_guess[WORD_SIZE], char answers[ANSWER_LENGTH][WORD_SIZE], char guesses[GUESSES_LENGTH][WORD_SIZE], int all_outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1], int answer_indexes[ANSWER_LENGTH + 1])
{
    (*total_guesses)++; // increment the total guesses
    int *result = get_result(); // get the result from the current guess

    int answers_left = filter_answers(answers, answer_indexes, result, current_guess); // filter the answers to find how many answers are left
    if (result[0] == GREEN && result[1] == GREEN && result[2] == GREEN && result[3] == GREEN && result[4] == GUESSES_LENGTH)
    { // if the current guess is correct, return it and decrement total guesses (as we found it before the next guess)
        (*total_guesses)--;
        return current_guess;
    }
    else // otherwise print the amount of answers left
        printf("-- answers left: %d --\n\n", answers_left);

    if (answers_left == 0) // if we have no answers left, an error has occured so return null
        return NULL;
    else if (answers_left == 1) // if we have one answer left, return it
        return answers[answer_indexes[0]];

    char *next_best = find_best_guess(guesses, answers, all_outcomes, answer_indexes); // otherwise find the next best guess
    printf(" GUESS: %s         \n", next_best); // print it out
    return solve_word(total_guesses, next_best, answers, guesses, all_outcomes, answer_indexes); // keep solving
}

int main()
{
    char answers[ANSWER_LENGTH][WORD_SIZE];
    char guesses[GUESSES_LENGTH][WORD_SIZE];
    get_answers_guesses(answers, guesses); // get answers and guesses

    char *first_guess = get_first_guess(guesses); // get the first guess

    int all_outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1];
    get_all_possible_outcomes(all_outcomes); // get all outcomes

    int answer_indexes[ANSWER_LENGTH + 1]; // initialise answer indexes that stores the indexes of all currently available answers
    for (int i = 0; i < ANSWER_LENGTH; i++)
        answer_indexes[i] = i;
    answer_indexes[ANSWER_LENGTH] = NULL_INDEX;

    int total_guesses = 1; // we've had one guess already
    char *solution = solve_word(&total_guesses, first_guess, answers, guesses, all_outcomes, answer_indexes); // solve for the word

    if (solution == NULL) // if invalid results were inputted that lead to no answers left
    {
        printf("** ERROR: no answers left - invalid result(s) **\n");
        return 1;
    }
    printf("** ANSWER: %s - Guesses: %d **\n\n", solution, total_guesses); // print the summary of the solution
    return 0;
}
