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