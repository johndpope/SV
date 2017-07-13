/* tslint:disable */

declare var Object: any;
export interface ProductInterface {
  creatorId: string;
  title: string;
  description: string;
  pictures: Array<any>;
  url: string;
  originalUrl: string;
  price: number;
  brand: any;
  stores?: Array<string>;
  exclusive?: any;
  affiliateNetwork?: string;
  imageURLs?: Array<string>;
  created?: Date;
  modified?: Date;
  id?: any;
}

export class Product implements ProductInterface {
  creatorId: string;
  title: string;
  description: string;
  pictures: Array<any>;
  url: string;
  originalUrl: string;
  price: number;
  brand: any;
  stores: Array<string>;
  exclusive: any;
  affiliateNetwork: string;
  imageURLs: Array<string>;
  created: Date;
  modified: Date;
  id: any;
  constructor(data?: ProductInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Product`.
   */
  public static getModelName() {
    return "Product";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Product for dynamic purposes.
  **/
  public static factory(data: ProductInterface): Product{
    return new Product(data);
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
      name: 'Product',
      plural: 'Products',
      properties: {
        creatorId: {
          name: 'creatorId',
          type: 'string',
          default: ''
        },
        title: {
          name: 'title',
          type: 'string',
          default: ''
        },
        description: {
          name: 'description',
          type: 'string',
          default: ''
        },
        pictures: {
          name: 'pictures',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        url: {
          name: 'url',
          type: 'string',
          default: ''
        },
        originalUrl: {
          name: 'originalUrl',
          type: 'string',
          default: ''
        },
        price: {
          name: 'price',
          type: 'number'
        },
        brand: {
          name: 'brand',
          type: 'any',
          default: <any>null
        },
        stores: {
          name: 'stores',
          type: 'Array&lt;string&gt;',
          default: <any>[]
        },
        exclusive: {
          name: 'exclusive',
          type: 'any',
          default: <any>null
        },
        affiliateNetwork: {
          name: 'affiliateNetwork',
          type: 'string'
        },
        imageURLs: {
          name: 'imageURLs',
          type: 'Array&lt;string&gt;'
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
