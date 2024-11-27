const tasks = []; // Простий масив для зберігання задач

module.exports = {
  addTask(name, description, executor) {
    const task = {
      id: tasks.length + 1,
      name,
      description,
      executor,
      executorId: `@${executor}`,
      done: false,
    };
    tasks.push(task);
    return task;
  },

  getTasksByExecutor(executor) {
    return tasks.filter((task) => task.executor === executor && !task.done);
  },

  markTaskAsDone(executor, taskIndex) {
    const executorTasks = tasks.filter(
      (task) => task.executor === executor && !task.done
    );
    if (taskIndex < 0 || taskIndex >= executorTasks.length) {
      return { success: false };
    }

    const task = executorTasks[taskIndex];
    task.done = true;
    return { success: true, task };
  },
};
