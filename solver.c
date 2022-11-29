/**
 * Solver for Wordle
 * @author Samir Gupta
 * @date 2022-09-11
 * @note This implementation was originally translated from Python
 */

#include "shared.c"

#define ANSWER_LENGTH 2315   // the amount of valid answers wordle has
#define GUESSES_LENGTH 12972 // the amount of valid guesses wordle allows

#define WORD_SIZE 6 // the total word size of each word (5 + escaping)

#define TOTAL_OUTCOMES 243 // the total number of outcomes possible in wordle
#define GREEN_INPUT 'g'    // the green input character
#define ORANGE_INPUT 'o'   // the orange input character
#define BLACK_INPUT '-'    // the black input character

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

    // check all available answers first
    int z = 0;
    while (answer_indexes[z] != NULL_INDEX)
    {
        int total = TOTAL_OUTCOMES; // initialise total number of valid outcomes
        int possibles = 0;          // initialise number of possible answers

        for (int j = 0; j < TOTAL_OUTCOMES; j++) // for each outcome
        {
            int answers_left = 0; // initialise number of answers left for this outcome
            int k = 0;
            while (answer_indexes[k] != NULL_INDEX) // for each available answer check if it is possible with the current guess and outcome
            {
                if (is_possible(answers[answer_indexes[k]], answers[answer_indexes[z]], outcomes[j]))
                    answers_left++; // if so add to number of answers left for this outcome
                k++;
            }

            if (answers_left == 0)     // if we have no answers left for this outcome
                total--;               // valid outcomes decreases
            possibles += answers_left; // add to total number of possible answers
        }

        double average_words_left = (double)possibles / total; // get the average number of answers left for this guess
        if (average_words_left == 1)
            return answers[answer_indexes[z]]; // if average is 1, shortcut and return immediately (can't get better)

        if (average_words_left < min_average) // otherwise, update min_average, and min_word if out new average is smaller than min_average
        {
            strcpy(min_word, answers[answer_indexes[z]]);
            min_average = average_words_left;
        }

        if (z % 3 == 0)
            printf("Checking answers.\r"); // print current state of processing
        else if (z % 3 == 1)
            printf("Checking answers..\r");
        else
            printf("Checking answers...\r");
        fflush(stdout);
        z++;
    }

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
    (*total_guesses)++;         // increment the total guesses
    int *result = get_result(); // get the result from the current guess

    int answers_left = filter_answers(answers, answer_indexes, result, current_guess); // filter the answers to find how many answers are left
    if (result[0] == GREEN && result[1] == GREEN && result[2] == GREEN && result[3] == GREEN && result[4] == GREEN)
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

    char *next_best = find_best_guess(guesses, answers, all_outcomes, answer_indexes);           // otherwise find the next best guess
    printf(" GUESS: %s         \n", next_best);                                                  // print it out
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

    int total_guesses = 1;                                                                                    // we've had one guess already
    char *solution = solve_word(&total_guesses, first_guess, answers, guesses, all_outcomes, answer_indexes); // solve for the word

    if (solution == NULL) // if invalid results were inputted that lead to no answers left
    {
        printf("** ERROR: no answers left - invalid result(s) **\n");
        return 1;
    }
    printf("** ANSWER: %s - Guesses: %d **\n\n", solution, total_guesses); // print the summary of the solution
    return 0;
}
