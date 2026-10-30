import aiToolRegistry from "../../../ai/services/aiAgent.service.js";

export const executeTool = async (toolName, args, authContext = {}) => {
  return await aiToolRegistry.executeTool(toolName, args, authContext);
};

export default executeTool;
