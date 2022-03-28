import { User } from '../model/User';
import { Op } from 'sequelize';

export default class UserRepository {
  public static createUser = async (): Promise<User> => {
    const user = User.build({ firstName: 'Mohammad ', lastName: 'Faisal' });
    return await user.save();

    // alternative
    return await User.create({ firstName: 'Mohammad ', lastName: 'Faisal' });
  };

  public static updateUser = async (id: number) => {
    const user = await User.create({ firstName: 'Jane' });
    user.lastName = 'Updated Name';
    return await user.save();
  };

  public static updateUserDirectly = async (id: number) => {
    return await User.update({ lastName: 'Updated' }, { where: { userId: id } });
  };

  public static deleteUser = async (id: number) => {
    const user = await User.create({ firstName: 'Jane' });

    await user.destroy();
  };

  public static getAllUsers = () => {
    return User.findAll();
  };
  public static getAllUsersPaginated = (offset: number, limit: number) => {
    return User.findAll({ offset, limit });
  };

  public static findById = (id: string) => {
    return User.findAll({ where: { userId: id } });
    // or
    return User.findOne({ where: { userId: id } });
    return User.findByPk(id);
  };

  public static findAllById = (idList: number[]) => {
    return User.findAll({ where: { userId: [...idList] } });
  };

  public static findByDateRange = (numberOfDays: number) => {
    return User.findAll({
      where: {
        createdAt: {
          [Op.lt]: new Date(),
          [Op.gt]: new Date(new Date().getSeconds() - numberOfDays * 24 * 60 * 60 * 1000),
        },
      },
    });
  };
}
