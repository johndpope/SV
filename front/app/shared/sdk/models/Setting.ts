/* tslint:disable */

declare var Object: any;
export interface SettingInterface {
  name: string;
  description?: string;
  category: string;
  configName: string;
  configValue: string;
  configValueType: string;
  position?: number;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Setting implements SettingInterface {
  name: string;
  description: string;
  category: string;
  configName: string;
  configValue: string;
  configValueType: string;
  position: number;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: SettingInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Setting`.
   */
  public static getModelName() {
    return "Setting";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Setting for dynamic purposes.
  **/
  public static factory(data: SettingInterface): Setting{
    return new Setting(data);
  }  
  /**
  * @method getModelDefinition
  * @author Julien Ledun
  * @license MIT
  * This method returns an object that represents some of the model
  * definitions.
  **/
  public static getModelDefinition() {
    return {
      name: 'Setting',
      plural: 'Settings',
      properties: {
        name: {
          name: 'name',
          type: 'string'
        },
        description: {
          name: 'description',
          type: 'string'
        },
        category: {
          name: 'category',
          type: 'string'
        },
        configName: {
          name: 'configName',
          type: 'string'
        },
        configValue: {
          name: 'configValue',
          type: 'string'
        },
        configValueType: {
          name: 'configValueType',
          type: 'string',
          default: `function () {
    // string as default
    return "string";
  }`
        },
        position: {
          name: 'position',
          type: 'number',
          default: 0
        },
        created: {
          name: 'created',
          type: 'Date',
          default: new Date(0)
        },
        modified: {
          name: 'modified',
          type: 'Date',
          default: new Date(0)
        },
        id: {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
      }
    }
  }
}
