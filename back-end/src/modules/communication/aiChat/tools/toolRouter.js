import { SearchCategoryTool } from "./SearchCategoryTool.js";
import { SearchOrderTool } from "./SearchOrderTool.js";
import { SearchProductTool } from "./SearchProductTool.js";
import { SearchVoucherTool } from "./SearchVoucherTool.js";
import { SearchWebsiteInfoTool } from "./SearchWebsiteInfoTool.js";

class ToolRouter {
  constructor() {
    this.tools = new Map(
      [
        new SearchProductTool(),
        new SearchCategoryTool(),
        new SearchVoucherTool(),
        new SearchOrderTool(),
        new SearchWebsiteInfoTool(),
      ].map((tool) => [tool.name, tool])
    );
  }

  async execute(name, params) {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool.execute(params);
  }
}

export default new ToolRouter();
