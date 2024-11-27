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
    
    console.log(task.executor)

    // Надсилання повідомлення виконавцю
    try {
      await bot.telegram.sendMessage(
        task.executorId, // executorId має бути правильним chat_id
        `Вам призначено нову задачу: ${taskName}\nОпис: ${description}\nПерегляньте список задач у боті.`
      );
    } catch (sendError) {
      console.error(
        'Помилка при відправленні повідомлення виконавцю:',
        sendError
      );
      ctx.reply(
        'Не вдалося надіслати повідомлення виконавцю. Переконайтеся, що він почав чат з ботом.'
      );
    }
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

bot.launch();
console.log('Бот запущено!');
