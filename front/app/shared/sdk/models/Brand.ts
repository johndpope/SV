/* tslint:disable */

declare var Object: any;
export interface BrandInterface {
  name: string;
  description?: string;
  category?: Array<any>;
  picture?: any;
  website: Array<string>;
  affiliateNetwork: string;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Brand implements BrandInterface {
  name: string;
  description: string;
  category: Array<any>;
  picture: any;
  website: Array<string>;
  affiliateNetwork: string;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: BrandInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Brand`.
   */
  public static getModelName() {
    return "Brand";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Brand for dynamic purposes.
  **/
  public static factory(data: BrandInterface): Brand{
    return new Brand(data);
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
      name: 'Brand',
      plural: 'Brands',
      properties: {
        name: {
          name: 'name',
          type: 'string',
          default: `function () {
      return null;
  }`
        },
        description: {
          name: 'description',
          type: 'string',
          default: `function () {
      return null;
  }`
        },
        category: {
          name: 'category',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        picture: {
          name: 'picture',
          type: 'any'
        },
        website: {
          name: 'website',
          type: 'Array&lt;string&gt;',
          default: <any>[]
        },
        affiliateNetwork: {
          name: 'affiliateNetwork',
          type: 'string'
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
