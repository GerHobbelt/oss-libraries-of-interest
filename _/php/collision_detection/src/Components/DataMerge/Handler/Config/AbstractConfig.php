<?php
/**
 * @author Yury Kozyrev <ykmship@yandex-team.ru>
 */

namespace Kozz\Components\DataMerge\Handler\Config;

use Kozz\Components\Closure\AbstractClosureConstructor;

class AbstractConfig extends AbstractClosureConstructor
{
  const COLLISION_ID_UPDATE = 'COLLISION_ID_UPDATE';
  const COLLISION_ID_APPEND = 'COLLISION_ID_APPEND';

}