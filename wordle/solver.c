/**
 * Solver for Wordle
 * @author Samir Gupta
 * @version 1.0
 * @date 2022-09-11
 * @note This implementation was originally translated from Python
*/

#include <stdio.h>
#include <stdbool.h>
#include <string.h>

#define ANSWER_LENGTH 2315 // the amount of valid answers wordle has
#define GUESSES_LENGTH 12972 // the amount of valid guesses wordle allows

#define WORD_SIZE 6 // the total word size of each word (5 + escaping)
#define ALPHABET_SIZE 26 // the total size of the alphabet the words derive from

#define TOTAL_OUTCOMES 243 // the total number of outcomes possible in wordle
#define OUTCOMES_LENGTH 3 // the total number of options for each letter in an outcome
#define GREEN_INPUT 'g' // the green input character
#define ORANGE_INPUT 'o' // the orange input character
#define BLACK_INPUT '-' // the black input character
#define GREEN 2 // the green integer used in replacement of the green character
#define ORANGE 1 // the orange integer used in replacement of the orange character
#define BLACK 0 // the black integer used in replacement of the black character

#define NULL_INDEX -1

int *get_result()
{
    static int result[WORD_SIZE - 1];
    while (1) {
        printf("RESULT: ");
        int error_detected = 0;
        for (int i = 0; i < WORD_SIZE - 1; i++)
        {
            char c = getchar();
            if (c == '\n')
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
                error_detected = 1;
        }
        if (error_detected == 0) 
            return result;
        printf("** invalid result **\n");
    }
}

void get_answers_guesses(char answers[][WORD_SIZE], char guesses[][WORD_SIZE])
{
    FILE *f = fopen("answers.txt", "r");
    for (int i = 0; i < ANSWER_LENGTH; i++)
    {
        char other[WORD_SIZE];
        fgets(answers[i], WORD_SIZE, f);
        strcpy(guesses[i], answers[i]);
        fgets(other, WORD_SIZE, f);
    }
    fclose(f);

    f = fopen("guesses.txt", "r");
    for (int i = 0; i < GUESSES_LENGTH; i++)
    {
        char other[WORD_SIZE];
        fgets(guesses[i + ANSWER_LENGTH], WORD_SIZE, f);
        fgets(other, WORD_SIZE, f);
    }
    fclose(f);
}

void get_all_possible_outcomes(int outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1])
{
    for (int i = 0; i < TOTAL_OUTCOMES; i++)
    {
        int num = i;
        for (int j = 0; j < WORD_SIZE - 1; j++)
        {
            outcomes[i][WORD_SIZE - 1 - j - 1] = num % OUTCOMES_LENGTH;
            num /= OUTCOMES_LENGTH;
        }
    }
}

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

bool is_possible(char answer[WORD_SIZE], char guess[WORD_SIZE], int outcome[WORD_SIZE - 1])
{
    int order[OUTCOMES_LENGTH][WORD_SIZE];
    int a = 0, b = 0, c = 0;
    for (int i = 0; i < WORD_SIZE - 1; i++)
    {
        if (outcome[i] == GREEN)
            order[0][a++] = i;
        else if (outcome[i] == ORANGE)
            order[1][b++] = i;
        else
            order[2][c++] = i;
    }
    order[0][a] = NULL_INDEX;
    order[1][b] = NULL_INDEX;
    order[2][c] = NULL_INDEX;

    int checked[ALPHABET_SIZE] = {};

    for (int i = 0; i < OUTCOMES_LENGTH; i++)
    {
        int j = 0;
        while (order[i][j] != NULL_INDEX)
        {
            int index = order[i][j];
            int count = count_chr(answer, guess[index]);
            int checked_index = guess[index] - 'a' + 1;

            if (outcome[index] == GREEN)
            {
                if (answer[index] != guess[index])
                    return false;

                checked[checked_index]++;
            }

            else if (outcome[index] == ORANGE)
            {
                if (checked[checked_index] == 0)
                {
                    if (count == 0 || guess[index] == answer[index])
                        return false;
                }

                else
                {
                    if (checked[checked_index] == count || guess[index] == answer[index])
                        return false;
                }
                checked[checked_index]++;
            }

            else
            {
                if (count != 0)
                {
                    if (checked[checked_index] == 0)
                        return false;
                    else
                    {
                        if (checked[checked_index] < count)
                        {
                            return false;
                        }
                    }
                }
            }
            j++;
        }
    }

    return true;
}

char *find_best_guess(char guesses[GUESSES_LENGTH][WORD_SIZE], char answers[ANSWER_LENGTH][WORD_SIZE], int outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1], int answer_indexes[ANSWER_LENGTH + 1])
{
    double min_average = ANSWER_LENGTH;
    static char min_word[WORD_SIZE];

    for (int i = 0; i < GUESSES_LENGTH; i++)
    {
        int total = TOTAL_OUTCOMES;
        int possibles = 0;

        for (int j = 0; j < TOTAL_OUTCOMES; j++)
        {
            int answers_left = 0;
            int k = 0;
            while (answer_indexes[k] != NULL_INDEX)
            {
                if (is_possible(answers[answer_indexes[k]], guesses[i], outcomes[j]))
                    answers_left++;
                k++;
            }

            if (answers_left == 0)
                total--;
            possibles += answers_left;
        }

        double average_words_left = (double)possibles / total;
        if (average_words_left == 1)
            return guesses[i];

        if (average_words_left < min_average)
        {
            strcpy(min_word, guesses[i]);
            min_average = average_words_left;
        }

        printf("Checking %d/%d\r", i + 1, GUESSES_LENGTH);
        fflush(stdout);
    }

    return min_word;
}

int filter_answers(char answers[ANSWER_LENGTH][WORD_SIZE], int answer_indexes[ANSWER_LENGTH + 1], int result[WORD_SIZE - 1], char current_guess[WORD_SIZE])
{
    int new_indexes[ANSWER_LENGTH + 1];
    int new_length = 0;
    int i = 0;

    while (answer_indexes[i] != NULL_INDEX)
    {
        int index = answer_indexes[i];
        if (is_possible(answers[index], current_guess, result))
            new_indexes[new_length++] = index;
        i++;
    }
    new_indexes[new_length] = NULL_INDEX;

    int j = 0;
    while (new_indexes[j] != NULL_INDEX)
    {
        answer_indexes[j] = new_indexes[j];
        j++;
    }
    answer_indexes[j] = NULL_INDEX;

    return new_length;
}

char *solve_word(int *total_guesses, char current_guess[WORD_SIZE], char answers[ANSWER_LENGTH][WORD_SIZE], char guesses[GUESSES_LENGTH][WORD_SIZE], int all_outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1], int answer_indexes[ANSWER_LENGTH + 1])
{
    (*total_guesses)++;
    int *result = get_result();

    int new_length = filter_answers(answers, answer_indexes, result, current_guess);
    if (result[0] == GREEN && result[1] == GREEN && result[2] == GREEN && result[3] == GREEN && result[4] == GUESSES_LENGTH)
    {
        (*total_guesses)--;
        return current_guess;
    }
    else
        printf("-- answers left: %d --\n\n", new_length);

    if (new_length == 0)
    {
        *total_guesses = NULL_INDEX;
        return "";
    }
    else if (new_length == 1)
        return answers[answer_indexes[0]];

    char *next_best = find_best_guess(guesses, answers, all_outcomes, answer_indexes);
    printf(" GUESS: %s         \n", next_best);
    return solve_word(total_guesses, next_best, answers, guesses, all_outcomes, answer_indexes);
}

int main()
{
    char answers[ANSWER_LENGTH][WORD_SIZE];
    char guesses[GUESSES_LENGTH][WORD_SIZE];
    get_answers_guesses(answers, guesses);

    printf("\n GUESS: ");
    char first_guess[WORD_SIZE];
    for (int i = 0; i < WORD_SIZE - 1; i++)
        first_guess[i] = getchar();
    first_guess[WORD_SIZE - 1] = '\0';

    int all_outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1];
    get_all_possible_outcomes(all_outcomes);

    int answer_indexes[ANSWER_LENGTH + 1];
    for (int i = 0; i < ANSWER_LENGTH; i++)
        answer_indexes[i] = i;
    answer_indexes[ANSWER_LENGTH] = NULL_INDEX;

    int total_guesses = 1;
    char *solution = solve_word(&total_guesses, first_guess, answers, guesses, all_outcomes, answer_indexes);

    if (total_guesses == NULL_INDEX)
    {
        printf("** ERROR: no answers left - invalid result(s) **\n");
        return 1;
    }
    printf("** ANSWER: %s - Guesses: %d **\n\n", solution, total_guesses);
    return 0;
}
