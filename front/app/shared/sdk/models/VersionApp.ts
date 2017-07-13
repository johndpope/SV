/* tslint:disable */

declare var Object: any;
export interface VersionAppInterface {
  title: string;
  description?: string;
  releaseDate: Date;
  platform: string;
  version: string;
  url: string;
  build?: string;
  created?: Date;
  id?: any;
}

export class VersionApp implements VersionAppInterface {
  title: string;
  description: string;
  releaseDate: Date;
  platform: string;
  version: string;
  url: string;
  build?: string;
  created: Date;
  id: any;
  constructor(data?: VersionAppInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `VersionApp`.
   */
  public static getModelName() {
    return "VersionApp";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of VersionApp for dynamic purposes.
  **/
  public static factory(data: VersionAppInterface): VersionApp {
    return new VersionApp(data);
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
      name: 'VersionApp',
      plural: 'VersionApps',
      properties: {
        title: {
          name: 'title',
          type: 'string'
        },
        description: {
          name: 'description',
          type: 'string',
          default: `function () {
      // string as default
    return "";
  }`
        },
        releaseDate: {
          name: 'releaseDate',
          type: 'Date'
        },
        platform: {
          name: 'platform',
          type: 'string'
        },
        version: {
          name: 'version',
          type: 'string'
        },
        url: {
          name: 'url',
          type: 'string'
        },
        build: {
          name: 'build',
          type: "string",
          default: 0
        },
        created: {
          name: 'created',
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
