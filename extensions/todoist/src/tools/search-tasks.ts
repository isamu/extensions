import axios from "axios";

import { SyncData } from "../api";
import { todoist } from "../helpers/withTodoistApi";

const fetchTasks: Tools.SearchTasks = async () => {
  const token = await todoist.authorize();
  const todoistApi = axios.create({
    baseURL: "https://api.todoist.com/sync/v9",
    headers: { authorization: `Bearer ${token}` },
  });

  const { data } = await todoistApi.post<SyncData>("/sync", { sync_token: "*", resource_types: ["all"] });

  const tasks = data.items;

  // associate each task with their projects and labels using .map
  const projects = data.projects;
  const labels = data.labels;

  const detailedTasks = tasks.map((task) => {
    const project = projects.find((project) => project.id === task.project_id);
    const labelNames = task.labels.map((labelId) => labels.find((label) => label.id === labelId)?.name).filter(Boolean);

    return {
      ...task,
      project: project?.name,
      labels: labelNames,
    };
  });

  return detailedTasks;
};

export default fetchTasks;
