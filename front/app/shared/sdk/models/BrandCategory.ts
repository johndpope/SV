/* tslint:disable */

declare var Object: any;
export interface BrandCategoryInterface {
  name: string;
  description?: string;
  created?: Date;
  id?: any;
}

export class BrandCategory implements BrandCategoryInterface {
  name: string;
  description: string;
  created: Date;
  id: any;
  constructor(data?: BrandCategoryInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `BrandCategory`.
   */
  public static getModelName() {
    return "BrandCategory";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of BrandCategory for dynamic purposes.
  **/
  public static factory(data: BrandCategoryInterface): BrandCategory{
    return new BrandCategory(data);
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
      name: 'BrandCategory',
      plural: 'BrandCategories',
      properties: {
        name: {
          name: 'name',
          type: 'string',
          default: ''
        },
        description: {
          name: 'description',
          type: 'string',
          default: ''
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
