using System;
using System.Collections.Generic;

namespace OneWeb.Domain.Entities;

/// <summary>
/// T3.2 — Defines categories for blog posts. Previously, Blog posts had a CategoryId but no related entity.
/// </summary>
public class BlogCategory : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public bool Status { get; set; } = true;

    // Navigation property
    public virtual ICollection<Blog> Blogs { get; set; } = new List<Blog>();
}
