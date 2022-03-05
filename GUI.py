#!/usr/bin/env python3
# 
#   gui.py 
#   Samir Gupta
#   03/03/2022
#

# silence deprecation warning
import os
os.environ['TK_SILENCE_DEPRECATION'] = '1'

# import tkinter
import tkinter as tk
from tkinter import ttk

# main app attributes
APP_GEO = "800x500+300+20"
APP_TITLE = 'Wordle'
POPUP_GEO = "200x200+600+100"
PADDING_NORMAL = {'padx': 10, 'pady': 10}
PADDING_SMALL = {'padx': 0, 'pady': 5}
FONT_TEXT = {'font': ('calibri', 25)}
FONT_SMALL = {'font': ('calibri', 15)}

class Stats:
    # stats class to hold and change stats of current game
    def __init__(self):
        self.wins = 0
        self.losses = 0
        self.attempts = 0
        self.average = 0
    
    def toString(self):
        # for showing the stats to the user
        return f'Wins: {self.wins}\nLosses: {self.losses}\nAverage: {self.average}'

    def win(self, n):
        self.wins += 1
        self.attempts += n
        self.average = round(self.attempts/self.wins, 1)

    def lose(self):
        self.losses += 1 


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.geometry(APP_GEO)
        self.title(APP_TITLE)
        self.attributes('-topmost', 1)

        # inital attirbutes
        self.columns = 15
        self.r = self.c = 1
        from answers import answers
        from guesses import guesses
        self.answers = answers
        self.guesses = guesses
        self.chosen = []
        self.word = ''
        self.rand_word()
        self.stats = Stats()

        for c in range(self.columns):
            self.columnconfigure(c, weight=1)

        # setting up the window with 6 rows of 5 spots for letters
        for r in range(7):
            if r == 0:
                self.blank_row = tk.Label()
                self.blank_row.grid(row=r, column=0, columnspan=self.columns)
                continue
            for c in (0, 10):
                name = f'blank_{r}{c}'
                setattr(self, name, tk.Label(width=15))
                self.__getattribute__(name).grid(column=c, row=r, columnspan=5, **PADDING_SMALL)
            for c in range(5):
                name = f'box{r}_{c+1}'
                setattr(self, name, tk.Label(width=3, bg="grey", **FONT_TEXT))
                self.__getattribute__(name).grid(column=5+c, row=r, **PADDING_SMALL)
        
        # setting and placing the letter buttons
        letters = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
        for r in range(len(letters)):
            c_s = [2, 3, 3][r]
            for i in range(len(letters[r])):
                l = letters[r][i]
                name = f'but_{l}'
                setattr(self, name, ttk.Button(text=l.upper(), width=5, command=lambda l=l: self.place(l.upper())))
                self.__getattribute__(name).grid(column=c_s+i, row=8+r, **PADDING_SMALL)

        # setting and placing the enter and backspace buttons
        self.but_EN = ttk.Button(width=5, text='ENTER', command=lambda: self.enter())
        self.but_BA = ttk.Button(width=5, text='BACK', command=lambda: self.backspace())
        self.but_EN.grid(column=10, row=10, columnspan=2, **PADDING_SMALL)
        self.but_BA.grid(column=2, row=9, rowspan=2, **PADDING_SMALL)

        # binding keys to respective button functions
        self.bind('<Return>', lambda e: self.enter())
        self.bind('<BackSpace>', lambda e: self.backspace())
        for letter in 'abcdefghijklmnopqrstuvwxyz':
            self.bind(f'<KeyPress-{letter}>', lambda e, l=letter: self.place(l.upper()))

        # defining the styles to be used by the buttons
        self.style = ttk.Style(self)
        self.style.theme_use('alt')
        self.style.configure("TButton", background="grey", foreground="black")
        self.style.map('TButton', background=[("active", "grey")])
        self.style.configure("O.TButton", background="orange", foreground="black")
        self.style.map('O.TButton', background=[("active", "orange")])
        self.style.configure("G.TButton", background="green", foreground="black")
        self.style.map('G.TButton', background=[("active", "green")])
        self.style.configure("D.TButton", background="gray18", foreground="black")
        self.style.map('D.TButton', background=[("active", "gray18")])


    def rand_word(self):
        # finding a random word in answers, making sure it has not been picked before
        from random import randint
        i = randint(0, len(self.answers) - 1)
        while i in self.chosen:
            i = randint(0, len(self.answers) - 1)
        self.chosen.append(i)
        self.word = self.answers[i]


    def check(self, att):
        # checking the attempt against the word
        # returns an array of style names based on the letters
        styles = []
        checked = set()
        for y in range(len(att)):
            if att[y] == self.word[y]:
                styles.append('G.TButton')
                checked.add(att[y])
            else:
                styles.append('D.TButton')
        for x in range(len(att)):
            if att[x] in self.word and (att[x] not in checked or self.word.count(att[x]) > 1):
                styles[x] = 'O.TButton' if styles[x] != 'G.TButton' else 'G.TButton'
                checked.add(att[x])
        return styles


    def place(self, char):
        # called either by the buttons or bindings
        # places a letter into position
        if self.c <= 5 and self.r <= 6:
            self.c = 1 if self.c < 1 else self.c
            error = f'blank_{self.r}10'
            name = f'box{self.r}_{self.c}'
            self.__getattribute__(error).configure(text='')
            self.__getattribute__(name).configure(text=char)
        self.c += 1


    def backspace(self):
        # called either by its button or binding
        # removes current letter from position
        if self.c >= 2 and self.r <= 6:
            self.c = 5 if self.c > 6 else self.c - 1
            error = f'blank_{self.r}10'
            name = f'box{self.r}_{self.c}'
            self.__getattribute__(error).configure(text='')
            self.__getattribute__(name).configure(text='')


    def enter(self):
        # called either by its button or binding
        # checks the word entered
        att = ''
        for c in range(1, 6):
            # retrieve word from input
            att += self.__getattribute__(f'box{self.r}_{c}').cget('text').lower()
        
        # check if input is valid
        if len(att) != 5 or att not in self.answers + self.guesses:
            self.__getattribute__(f'blank_{self.r}10').configure(text='Invalid Attempt')
            return

        # check input against actual word
        styles = self.check(att)

        # edit the boxes and button to display the correct colours
        for x in range(len(styles)):
            box = self.__getattribute__(f'box{self.r}_{x+1}')
            box_style = styles[x] if styles[x] != 'D.TButton' else 'TButton'
            box.configure(bg=self.style.lookup(box_style, "background"))

            button = self.__getattribute__(f'but_{att[x]}')
            style = button.cget('style')
            if styles[x] == 'G.TButton' or \
                (styles[x] == 'O.TButton' and style != 'G.TButton') or \
                    (styles[x] == 'D.TButton' and style != 'G.TButton' and style != 'O.TButton'):
                button.configure(style=styles[x])

        self.r += 1
        self.c = 1

        # check if current game has result
        if styles == ['G.TButton', 'G.TButton', 'G.TButton', 'G.TButton', 'G.TButton']:
            self.end_game(True)
        elif self.r > 6:
            self.end_game(False)


    def end_game(self, win):
        # called if the game has a result

        # unbinds keys and disables main buttons so that window is uninteractive
        self.unbind('<Return>')
        self.unbind('<Backspace>')
        self.__getattribute__('but_BA').configure(command='')
        self.__getattribute__('but_EN').configure(command='')

        # get title and message for popup
        title = ''
        if win:
            self.stats.win(self.r-1) 
            title = 'You Win!'
        else:
            self.stats.lose()
            title = f'You lose! ({self.word})'
        message = self.stats.toString()

        # to stop ability to place letters
        self.r = 7

        # deploy the popup
        self.popup = Popup(self, title, message)
        

    def restart(self):
        # called to restart the game

        # rebinds and re-enables the main buttons to make window interactive again
        self.bind('<Return>', lambda e: self.enter())
        self.bind('<BackSpace>', lambda e: self.backspace())
        self.__getattribute__('but_BA').configure(command=lambda: self.backspace())
        self.__getattribute__('but_EN').configure(command=lambda: self.enter())
        
        # get new word
        self.rand_word()
        self.r = self.c = 1

        # reset box colours and button colours
        for r in range(6):
            for c in range(5):
                box = f'box{r+1}_{c+1}'
                self.__getattribute__(box).configure(bg="grey", text="")
        for l in 'abcdefghijklmnopqrstuvwxyz':
            self.__getattribute__(f'but_{l}').configure(style='TButton')


class Popup(tk.Tk):
    # popup tkinter class
    def __init__(self, parent, title, message):
        super().__init__()
        # main attributes
        self.parent = parent
        self.geometry(POPUP_GEO)
        self.title(title)
        self.attributes('-topmost', 1)

        # titles for the framework
        question_title = 'Continue?'
        positive_title = 'Yes'
        negative_title = 'No'

        self.columnconfigure(0, weight=1)
        self.columnconfigure(1, weight=1)

        # create and place message
        message = tk.Message(self, text=message, **FONT_TEXT)
        message.grid(column=0, row=0, columnspan=2, sticky=tk.W, **PADDING_NORMAL)

        # create and place user question
        question = tk.Label(self, text=question_title, **FONT_SMALL)
        question.grid(column=0, row=1, columnspan=2, **PADDING_SMALL)

        # create and place the negative button
        negative_button = ttk.Button(self, text=negative_title, command=lambda: self.negative())
        negative_button.grid(column=0, row=2, **PADDING_SMALL)

        # create and place the positive button
        positive_button = ttk.Button(self, text=positive_title, command=lambda: self.positive())
        positive_button.grid(column=1, row=2, **PADDING_SMALL)

        # define button styles
        style = ttk.Style(self)
        style.theme_use('alt')
        style.configure("TButton", background="grey", foreground="black")
        style.map('TButton', background=[("active", "grey")])

    def positive(self):
        # function to be run when positive button is pressed

        # restart the game and destroy self
        try: 
            self.parent.restart()
        except: # if user has already destroyed parent
            pass
        self.destroy()

    def negative(self):
        # function to be run when negative button is pressed

        # destroy both parent and self
        try:
            self.parent.destroy()
        except: # if user has already destroyed parent
            pass
        self.destroy()


if __name__ == '__main__':
    app = App()
    app.mainloop()