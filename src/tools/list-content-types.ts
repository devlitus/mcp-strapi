import { z } from 'zod';
import { strapiClient } from '../services/strapi-client.js';

export const listContentTypesToolSchema = {};

export const listContentTypesToolHandler = async () => {
  try {
    console.error('[LIST CONTENT TYPES TOOL] Fetching all content types');

    const result = await strapiClient.getContentTypes();

    // Extract useful information from content types
    const contentTypes = result.data.map((ct: any) => ({
      uid: ct.uid,
      apiID: ct.apiID,
      kind: ct.kind,
      displayName: ct.schema?.displayName || ct.apiID,
      singularName: ct.schema?.singularName,
      pluralName: ct.schema?.pluralName,
      attributes: Object.keys(ct.schema?.attributes || {}),
    }));

    const output = {
      success: true,
      count: contentTypes.length,
      contentTypes,
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: `Successfully fetched ${output.count} content types\n\n${JSON.stringify(output, null, 2)}`,
        },
      ],
      structuredContent: output,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[LIST CONTENT TYPES TOOL ERROR] ${errorMessage}`);

    return {
      content: [
        {
          type: 'text' as const,
          text: `Error fetching content types: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
};
