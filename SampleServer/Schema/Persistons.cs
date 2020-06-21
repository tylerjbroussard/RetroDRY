﻿using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using RetroDRY;

namespace SampleServer.Schema
{
    /// <summary>
    /// Lookup table of phone types (like "cell", "work")
    /// </summary>
    [Prompt("Phone types")]
    public class PhoneTypeLookup : Persiston
    {
        public List<PhoneTypeRow> PhoneType;

        [Prompt("Type")]
        public class PhoneTypeRow : Row
        {
            [Key]
            [Prompt("ID")]
            public short? PhoneTypeId;

            [StringLength(20), MainColumn, SortColumn]
            [Prompt("Phone type")]
            public string TypeOfPhone;
        }
    }

    /// <summary>
    /// Lookup table of sale statuses (like Confirmed, Shipped etc)
    /// </summary>
    [Prompt("Sale statuses")]
    public class SaleStatusLookup : Persiston
    {
        public List<SaleStatusRow> SaleStatus;

        [Prompt("Status")]
        public class SaleStatusRow : Row
        {
            [Key]
            [Prompt("ID")]
            public short? StatusId;

            [StringLength(20, MinimumLength = 1), MainColumn, SortColumn]
            [Prompt("Sale status")]
            public string Name;

            [StringLength(20), WireType(Constants.TYPE_NSTRING)]
            public string Note;
        }
    }

    /// <summary>
    /// One employee with their contacts
    /// </summary>
    [SingleMainRow]
    public class Employee : Persiston
    {
        [Key]
        [Prompt("ID")]
        public int? EmployeeId;

        [StringLength(50, MinimumLength = 1), Prompt("First name")]
        public string FirstName;

        [StringLength(50, MinimumLength = 1), Prompt("Last name"), MainColumn]
        public string LastName;

        [ForeignKey(typeof(Employee))]
        [Prompt("Supervisor ID")]
        [LookupBehavior(typeof(EmployeeList))]
        public int? SupervisorId;

        [LeftJoin("SupervisorId", "LastName"), Prompt("Supervisor")]
        public string SupervisorLastName;

        [Prompt("Hired on")]
        public DateTime HireDate;

        public List<EContactRow> EContact;

        [SqlTableName("EmployeeContact"), ParentKey("EmployeeId")]
        [Prompt("Employee contact")]
        public class EContactRow : Row
        {
            [Key]
            [Prompt("ID")]
            public int? ContactId;

            [ForeignKey(typeof(PhoneTypeLookup)), Prompt("Phone type")]
            public short PhoneType;

            [StringLength(50), Prompt("Phone number")]
            public string Phone;
        }
    }

    /// <summary>
    /// One customer
    /// </summary>
    [SingleMainRow]
    public class Customer : Persiston
    {
        [Key]
        [Prompt("ID")]
        public int? CustomerId;

        [StringLength(200, MinimumLength = 1)]
        public string Company;

        [ForeignKey(typeof(Employee))]
        [LookupBehavior(typeof(EmployeeList))]
        [Prompt("Sales rep ID")]
        public int SalesRepId;

        [LeftJoin("SalesRepId", "LastName"), Prompt("Sales rep")]
        public string SalesRepLastName;

        [StringLength(4000), WireType(Constants.TYPE_NSTRING)]
        public string Notes;
    }

    /// <summary>
    /// One item that the company sells which can have multiple variants
    /// </summary>
    [SingleMainRow]
    public class Item : Persiston
    {
        [Key]
        [Prompt("ID")]
        public int? ItemId;

        [Prompt("I-code"), RegularExpression("^[A-Z]{2}-[0-9]{4}$"), MainColumn]
        public string ItemCode;

        [StringLength(200, MinimumLength = 10)]
        public string Description;

        public List<ItemVariantRow> ItemVariant;

        [ParentKey("ItemId")]
        [Prompt("Variant")]
        public class ItemVariantRow : Row
        {
            [Key]
            [Prompt("Var-ID")]
            public int? ItemVariantId;

            [StringLength(20, MinimumLength = 1), Prompt("Sub-code"), MainColumn, SortColumn]
            public string VariantCode;

            [StringLength(200, MinimumLength = 10)]
            public string Description;
        }
    }

    /// <summary>
    /// One sale including its line items and notes
    /// </summary>
    [SingleMainRow]
    public class Sale : Persiston
    {
        [Key, MainColumn]
        [Prompt("ID")]
        public int? SaleId;

        [ForeignKey(typeof(Customer))]
        [LookupBehavior(typeof(CustomerList))]
        [Prompt("Customer ID")]
        public int CustomerId;

        [Prompt("Sale date"), WireType(Constants.TYPE_DATETIME)]
        public DateTime SaleDate;

        [Prompt("Shipped on"), WireType(Constants.TYPE_DATETIME)]
        public DateTime? ShippedDate;

        [ForeignKey(typeof(SaleStatusLookup)), Prompt("Status")]
        public short Status;

        public List<SaleItemRow> SaleItem;

        [ParentKey("SaleId")]
        [Prompt("Item sold")]
        public class SaleItemRow : Row
        {
            [Key, SortColumn]
            [Prompt("ID")]
            public int? SaleItemId;

            [ForeignKey(typeof(Item))]
            [Prompt("Item-ID")]
            [LookupBehavior(typeof(ItemList))]
            public int ItemId;

            [Range(1, 999)]
            public int Quantity;

            [Prompt("Var-ID")]
            public int? ItemVariantId;

            public List<SaleItemNoteRow> SaleItemNote;

            [ParentKey("SaleItemId")]
            [Prompt("Sale note")]
            public class SaleItemNoteRow : Row
            {
                [Key]
                [Prompt("ID")]
                public int? SaleItemNoteId;

                [StringLength(4000), WireType(Constants.TYPE_NSTRING)]
                public string Note;
            }
        }
    }
}
