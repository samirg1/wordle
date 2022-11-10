/**
 * Determine the best first guess for Wordle.
 * @author Samir Gupta
 * @date: 10-11-2022
 */

#include "shared.c"

#define OUTPUT_FILE "first_guess.txt" // output file name
#define OUTPUT_LENGTH 20              // the length of each output in output file "XXXXX - "

/**
 * Find the minimum of a number array from index to end.
 * @param array The array to find the minimum of.
 * @param n The number of elements in the array.
 * @param index The index to start looking from.
 * @return The minimum of the array starting at index.
 */
int min(double *array, int n, int index)
{
    int min = index;
    for (int i = index + 1; i < n; i++)
    {
        if (array[i] < array[min])
        {
            min = i;
        }
    }
    return min;
}

/**
 * Swap two numeric elements in two arrays.
 * @param array The first array to swap elements in.
 * @param x The first index of the swap to perform.
 * @param y The second index of the swap to perform.
 * @param another The second array to swap elements in.
 */
void swap(double *array, int x, int y, int *another)
{
    double tmp = array[x];
    array[x] = array[y];
    array[y] = tmp;

    int tmp2 = another[x];
    another[x] = another[y];
    another[y] = tmp2;
}

/**
 * Perform selection sort on an array, whilst shuffling another array with respect to the first.
 * @param array The array to sort.
 * @param n The number of elements in the array.
 * @param another The second array to shuffle with respect to the first.
 */
void selection_sort(double *array, int n, int *another)
{
    for (int i = 0; i < n; i++)
    {
        int min_index = min(array, n, i);
        swap(array, min_index, i, another);
    }
}

/**
 * Get and print to a file all valid guesses and their corresponding average words left (in sorted order) for the first guess of Wordle.
 * @param guesses The array of all valid guesses.
 * @param answers The array of all valid answers.
 * @param outcomes The array of possible outcomes.
 */
void explore_possible_guesses(char guesses[GUESSES_LENGTH][WORD_SIZE], char answers[ANSWER_LENGTH][WORD_SIZE], int outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1])
{
    double guess_results[GUESSES_LENGTH];
    for (int i = 0; i < GUESSES_LENGTH; i++) // for each guess
    {
        int total = TOTAL_OUTCOMES; // initialise total number of valid outcomes
        int possibles = 0;          // initialise number of possible answers

        for (int j = 0; j < TOTAL_OUTCOMES; j++) // for each outcome
        {
            int answers_left = 0;                   // initialise number of answers left for this outcome
            for (int k = 0; k < ANSWER_LENGTH; k++) // for each answer check if it is possible with the current guess and outcome
            {
                if (is_possible(answers[k], guesses[i], outcomes[j]))
                    answers_left++; // if so add to number of answers left for this outcome
            }

            if (answers_left == 0)     // if we have no answers left for this outcome
                total--;               // valid outcomes decreases
            possibles += answers_left; // add to total number of possible answers
        }
        guess_results[i] = (double)possibles / total; // get the average number of answers left for this guess

        printf("Checking %d/%d\r", i + 1, GUESSES_LENGTH); // print current state of processing
        fflush(stdout);                                    // flush stdout for cleaner '\r' printing
    }

    int guess_indexes[GUESSES_LENGTH]; // get all indexes so that we can sort them with the results
    for (int i = 0; i < GUESSES_LENGTH; i++)
        guess_indexes[i] = i;

    selection_sort(guess_results, GUESSES_LENGTH, guess_indexes); // sort the guess results

    FILE *f = fopen(OUTPUT_FILE, "w");
    for (int i = 0; i < GUESSES_LENGTH; i++)
    {
        char output[OUTPUT_LENGTH] = "\0";
        strcpy(output, guesses[guess_indexes[i]]);
        strcat(output, " - ");
        fprintf(f, "%s%5.2lf\n", output, guess_results[i]);
    }
}

int main()
{
    char answers[ANSWER_LENGTH][WORD_SIZE];
    char guesses[GUESSES_LENGTH][WORD_SIZE];
    get_answers_guesses(answers, guesses); // get answers and guesses

    int all_outcomes[TOTAL_OUTCOMES][WORD_SIZE - 1];
    get_all_possible_outcomes(all_outcomes); // get all outcomes

    explore_possible_guesses(guesses, answers, all_outcomes);
    return 0;
}