require('dotenv').config();
const { Telegraf } = require('telegraf');
const db = require('./database');

const bot = new Telegraf(process.env.BOT_TOKEN);

const users = {}; // Список користувачів

// Адміністратор додає задачу
bot.command('add_task', async (ctx) => {
  const message = ctx.message.text;
  const args = message.split(' ');

  // Перевірка формату введеного запиту
  if (args.length < 4) {
    return ctx.reply('Формат: /add_task [виконавець] [назва задачі] [опис]');
  }

  const executor = args[1];
  const taskName = args[2];
  const description = args.slice(3).join(' ');

  try {
    // Додавання задачі в базу даних
    const task = await db.addTask(taskName, description, executor);
    ctx.reply(`Задача додана: ${taskName} для ${executor}`);


  } catch (error) {
    console.error('Помилка при додаванні задачі:', error);
    ctx.reply('Сталася помилка при додаванні задачі. Спробуйте знову.');
  }
});

// Виконавець переглядає свої задачі
bot.command('tasks', (ctx) => {
  const tasks = db.getTasksByExecutor(ctx.from.username);
  if (!tasks.length) {
    return ctx.reply('У вас немає задач.');
  }

  const response = tasks
    .map((t, i) => `${i + 1}. ${t.name} - ${t.description}`)
    .join('\n');
  ctx.reply(`Ваші задачі:\n${response}`);
});

// Виконавець завершує задачу
bot.command('done_task', (ctx) => {
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Формат: /done_task [номер задачі]');
  }

  const taskId = parseInt(args[1]) - 1;
  const result = db.markTaskAsDone(ctx.from.username, taskId);

  if (result.success) {
    ctx.reply(`Задача "${result.task.name}" позначена як виконана.`);
  } else {
    ctx.reply('Помилка: або задачі не існує, або вона вже завершена.');
  }
});

bot.command('tasks_for', async (ctx) => {
  const args = ctx.message.text.split(' ');

  // Перевірка формату команди
  if (args.length < 2) {
    return ctx.reply('Формат: /tasks_for [username]');
  }

  const executor = args[1]; // Ім'я виконавця

  try {
    // Отримання задач з бази даних
    const tasks = await db.getTasksByExecutor(executor);

    // Якщо задач немає
    if (!tasks || tasks.length === 0) {
      return ctx.reply(`У виконавця ${executor} немає активних задач.`);
    }

    // Формування відповіді
    const response = tasks
      .map((task, index) => `${index + 1}. ${task.name} - ${task.description}`)
      .join('\n');
    ctx.reply(`Задачі для ${executor}:\n${response}`);
  } catch (error) {
    console.error('Помилка при отриманні задач:', error);
    ctx.reply('Сталася помилка при отриманні задач. Спробуйте знову.');
  }
});

bot.launch();
console.log('Бот запущено!');
