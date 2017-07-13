/* tslint:disable */

declare var Object: any;
export interface MemberInterface {
  type: Array<number>;
  password?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  gender?: number;
  dateOfBirth?: Date;
  phone?: string;
  picture?: any;
  budget?: number;
  storeId?: string;
  lastLogin?: Date;
  friendsFB?: Array<any>;
  moneyAmount?: number;
  noOfConnections?: number;
  missions?: Array<any>;
  assets?: Array<any>;
  share?: any;
  device?: any;
  totalSale?: number;
  total_satisfied_customers?: number;
  total_spawned_customers?: number;
  vipCustomerEnergy?: number;
  level?: number;
  rank?: string;
  noOfProdNotify?: any;
  created?: Date;
  modified?: Date;
  email: string;
  emailVerified?: boolean;
  verificationToken?: string;
  id?: any;
  accessTokens?: any[];
  socialNetworks?: any[];
  budgets?: any[];
}

export class Member implements MemberInterface {
  type: Array<number>;
  password: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: number;
  dateOfBirth: Date;
  phone: string;
  picture: any;
  budget: number;
  storeId: string;
  lastLogin: Date;
  friendsFB: Array<any>;
  moneyAmount: number;
  noOfConnections: number;
  missions: Array<any>;
  assets: Array<any>;
  share: any;
  device: any;
  totalSale: number;
  total_satisfied_customers: number;
  total_spawned_customers: number;
  vipCustomerEnergy: number;
  level: number;
  rank: string;
  noOfProdNotify: any;
  created: Date;
  modified: Date;
  email: string;
  emailVerified: boolean;
  verificationToken: string;
  id: any;
  accessTokens: any[];
  socialNetworks: any[];
  budgets: any[];
  constructor(data?: MemberInterface) {
    Object.assign(this, data);
  }
  /**
   * The name of the model represented by this $resource,
   * i.e. `Member`.
   */
  public static getModelName() {
    return "Member";
  }
  /**
  * @method factory
  * @author Jonathan Casarrubias
  * @license MIT
  * This method creates an instance of Member for dynamic purposes.
  **/
  public static factory(data: MemberInterface): Member{
    return new Member(data);
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
      name: 'Member',
      plural: 'Members',
      properties: {
        type: {
          name: 'type',
          type: 'Array&lt;number&gt;',
          default: <any>[]
        },
        password: {
          name: 'password',
          type: 'string'
        },
        firstName: {
          name: 'firstName',
          type: 'string'
        },
        lastName: {
          name: 'lastName',
          type: 'string'
        },
        fullName: {
          name: 'fullName',
          type: 'string'
        },
        gender: {
          name: 'gender',
          type: 'number'
        },
        dateOfBirth: {
          name: 'dateOfBirth',
          type: 'Date',
          default: new Date(0)
        },
        phone: {
          name: 'phone',
          type: 'string'
        },
        picture: {
          name: 'picture',
          type: 'any'
        },
        budget: {
          name: 'budget',
          type: 'number',
          default: 0
        },
        storeId: {
          name: 'storeId',
          type: 'string'
        },
        lastLogin: {
          name: 'lastLogin',
          type: 'Date',
          default: new Date(0)
        },
        friendsFB: {
          name: 'friendsFB',
          type: 'Array&lt;any&gt;'
        },
        moneyAmount: {
          name: 'moneyAmount',
          type: 'number',
          default: 0
        },
        noOfConnections: {
          name: 'noOfConnections',
          type: 'number',
          default: 0
        },
        missions: {
          name: 'missions',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        assets: {
          name: 'assets',
          type: 'Array&lt;any&gt;',
          default: <any>[]
        },
        share: {
          name: 'share',
          type: 'any',
          default: <any>null
        },
        device: {
          name: 'device',
          type: 'any'
        },
        totalSale: {
          name: 'totalSale',
          type: 'number',
          default: 0
        },
        total_satisfied_customers: {
          name: 'total_satisfied_customers',
          type: 'number',
          default: 0
        },
        total_spawned_customers: {
          name: 'total_spawned_customers',
          type: 'number',
          default: 0
        },
        vipCustomerEnergy: {
          name: 'vipCustomerEnergy',
          type: 'number',
          default: 0
        },
        level: {
          name: 'level',
          type: 'number',
          default: 0
        },
        rank: {
          name: 'rank',
          type: 'string',
          default: `function () {
    return MEMBER_RANK_NAMES[0];
  }`
        },
        noOfProdNotify: {
          name: 'noOfProdNotify',
          type: 'any'
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
        email: {
          name: 'email',
          type: 'string'
        },
        emailVerified: {
          name: 'emailVerified',
          type: 'boolean'
        },
        verificationToken: {
          name: 'verificationToken',
          type: 'string'
        },
        id: {
          name: 'id',
          type: 'any'
        },
      },
      relations: {
        accessTokens: {
          name: 'accessTokens',
          type: 'any[]',
          model: ''
        },
        socialNetworks: {
          name: 'socialNetworks',
          type: 'any[]',
          model: ''
        },
        budgets: {
          name: 'budgets',
          type: 'any[]',
          model: ''
        },
      }
    }
  }
}
