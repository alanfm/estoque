<?php

namespace Acme\Customers\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class Customer extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'email', 'phone', 'company'];
}
